/* functions/handlers/marketplace.js */
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");
const { logUserAction } = require("../services/analytics");
const { createCheckoutSession } = require("../services/payments");

function unwrapData(request) {
  const data = request.data || request;
  if (!data) return {};
  if (typeof data === "object" && data.data) return data.data;
  return data;
}

function getUserId(request) {
  // FIX: v2 auth lives at request.auth, not context.auth
  if (request.auth?.uid) return request.auth.uid;
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true" || process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (isEmulator) return "emulator-test-user-123";
  return null;
}

async function createListing(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "You must be logged in to create a listing.");

    const input = unwrapData(request);
    const { title, description, price, category, condition, images } = input;

    if (!title || !price || !category) throw new HttpsError("invalid-argument", "Missing required fields.");
    const finalPrice = parseFloat(price);
    if (isNaN(finalPrice)) throw new HttpsError("invalid-argument", "Price must be a valid number.");

    const db = admin.firestore();
    const listingRef = db.collection("listings").doc();

    const listingData = {
      id: listingRef.id,
      title,
      description: description || "",
      price: finalPrice,
      category,
      condition: condition || "good",
      images: images || [],
      sellerId: userId,
      userId: userId, // needed by Firestore rules
      status: "pending", // pending | active | sold | deleted
      featured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await listingRef.set(listingData);
    try { await logUserAction(userId, "listing_created", { listingId: listingRef.id }); } catch (e) {}
    return { listingId: listingRef.id, ...listingData };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function getUserListings(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const db = admin.firestore();
    const snapshot = await db.collection("listings")
      .where("sellerId", "==", userId)
      .where("status", "in", ["active", "sold", "pending"])
      .orderBy("createdAt", "desc")
      .get();

    return { listings: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function getAllListings(request) {
  try {
    const input = unwrapData(request);
    const { category, condition, limit = 20, lastDocId } = input;

    const db = admin.firestore();
    let query = db.collection("listings").where("status", "==", "active").orderBy("createdAt", "desc");

    if (category && category !== "All") query = query.where("category", "==", category);
    if (condition) query = query.where("condition", "==", condition);

    if (lastDocId) {
      const lastDoc = await db.collection("listings").doc(lastDocId).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    query = query.limit(limit);
    const snapshot = await query.get();
    const listings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
      listings,
      hasMore: snapshot.docs.length === limit,
      lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function getListing(request) {
  try {
    const input = unwrapData(request);
    const { listingId } = input;
    if (!listingId) throw new HttpsError("invalid-argument", "Listing ID is required");

    const db = admin.firestore();
    const doc = await db.collection("listings").doc(listingId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Listing not found");

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function updateListing(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { listingId, title, description, price, category, condition, images } = input;
    if (!listingId) throw new HttpsError("invalid-argument", "Listing ID is required");

    const db = admin.firestore();
    const ref = db.collection("listings").doc(listingId);
    const doc = await ref.get();

    if (!doc.exists) throw new HttpsError("not-found", "Listing not found");
    if (doc.data().sellerId !== userId) throw new HttpsError("permission-denied", "Not authorized");

    const updateData = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (condition) updateData.condition = condition;
    if (images) updateData.images = images;

    await ref.update(updateData);
    return { success: true, listingId };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function deleteListing(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { listingId } = input;

    const db = admin.firestore();
    const ref = db.collection("listings").doc(listingId);
    const doc = await ref.get();

    if (!doc.exists) throw new HttpsError("not-found", "Listing not found");
    if (doc.data().sellerId !== userId) throw new HttpsError("permission-denied", "Not authorized");

    await ref.update({ status: "deleted", deletedAt: new Date() });
    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function contactSeller(request) {
  try {
    const buyerId = getUserId(request);
    if (!buyerId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { listingId, message } = input;

    const db = admin.firestore();
    const listingDoc = await db.collection("listings").doc(listingId).get();
    if (!listingDoc.exists) throw new HttpsError("not-found", "Listing not found");

    const listing = listingDoc.data();
    const sellerId = listing.sellerId;

    // 1. Create conversation (new system)
    const conversationId = `listing_${listingId}_${buyerId}_${sellerId}`;
    const conversationRef = db.collection("conversations").doc(conversationId);
    const convSnap = await conversationRef.get();

    if (!convSnap.exists) {
      await conversationRef.set({
        id: conversationId,
        itemType: "listing",
        itemId: listingId,
        itemTitle: listing.title,
        itemImage: listing.images?.[0] || null,
        participants: [buyerId, sellerId],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: message || "I'm interested in this item!",
        lastMessageAt: new Date(),
        lastMessageSenderId: buyerId,
      });
    }

    await conversationRef.collection("messages").add({
      conversationId,
      senderId: buyerId,
      text: message || "I'm interested in this item!",
      type: "text",
      createdAt: new Date(),
      read: false,
    });

    if (convSnap.exists) {
      await conversationRef.update({
        lastMessage: message || "I'm interested in this item!",
        lastMessageAt: new Date(),
        lastMessageSenderId: buyerId,
        updatedAt: new Date(),
      });
    }

    // 2. Keep old notification for backward compat (shows in Dashboard)
    await db.collection("notifications").add({
      toUserId: sellerId,
      fromUserId: buyerId,
      type: "buy_request",
      message: message || "I'm interested in this item!",
      item: listing.title,
      itemId: listingId,
      conversationId, // link to conversation
      createdAt: new Date(),
      read: false,
    });

    return { success: true, conversationId };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function featureListing(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { listingId } = input;

    const db = admin.firestore();
    const doc = await db.collection("listings").doc(listingId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Listing not found");
    if (doc.data().sellerId !== userId) throw new HttpsError("permission-denied", "Not authorized");

    return await createCheckoutSession({ userId, type: "listing_featured", itemId: listingId, amount: 500, description: `Feature listing: ${doc.data().title}`, successUrl: `${process.env.FRONTEND_URL}/marketplace?featured=true`, cancelUrl: `${process.env.FRONTEND_URL}/marketplace/${listingId}` });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

module.exports = { createListing, getUserListings, getAllListings, getListing, updateListing, deleteListing, contactSeller, featureListing };