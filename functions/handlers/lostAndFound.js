/* functions/handlers/lostAndFound.js */
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

// FIX: Safely import analytics — won't crash if the service file doesn't exist
let logUserAction;
try {
  logUserAction = require("../services/analytics").logUserAction;
} catch {
  logUserAction = async () => {}; // no-op fallback
}

function unwrapData(request) {
  const data = request.data || request;
  if (!data) return {};
  if (typeof data === "object" && data.data) return data.data;
  return data;
}

function getUserId(request) {
  if (request.auth?.uid) return request.auth.uid;
  const isEmulator =
    process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (isEmulator) return "emulator-test-user-123";
  return null;
}

// -------------------------------------------------------------------------
// 1. Post Lost or Found Item
// -------------------------------------------------------------------------
async function postItem(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { type, category, title, description, location, contactInfo, images, dateOccurred } = input;

    if (!type || !["lost", "found"].includes(type)) {
      throw new HttpsError("invalid-argument", "Type must be 'lost' or 'found'");
    }
    if (!category || !title || !description) {
      throw new HttpsError("invalid-argument", "Category, title, and description are required");
    }

    const db = admin.firestore();
    const itemRef = db.collection("lostAndFound").doc();

    const itemData = {
      id: itemRef.id,
      type,
      category,
      title,
      description,
      location: location || "",
      contactInfo: contactInfo || "",
      images: images || [],
      dateOccurred: dateOccurred || null,
      posterId: userId,
      status: "pending", // pending | active | claimed | resolved
      claimedBy: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await itemRef.set(itemData);

    try {
      await logUserAction(userId, "lost_found_posted", { itemId: itemRef.id, type, category });
    } catch (e) { /* swallow analytics errors */ }

    return { itemId: itemRef.id, success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 2. Get All Items (public)
// -------------------------------------------------------------------------
async function getItems(request) {
  try {
    const input = unwrapData(request);
    const { type, category, status = "active", limit = 20, lastDocId } = input;

    const db = admin.firestore();
    let q = db.collection("lostAndFound").where("status", "==", status);

    if (type && ["lost", "found"].includes(type)) {
      q = q.where("type", "==", type);
    }
    if (category && category !== "All") {
      q = q.where("category", "==", category);
    }

    q = q.orderBy("createdAt", "desc");

    if (lastDocId) {
      const lastDoc = await db.collection("lostAndFound").doc(lastDocId).get();
      if (lastDoc.exists) q = q.startAfter(lastDoc);
    }

    q = q.limit(limit);
    const snapshot = await q.get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
      items,
      hasMore: snapshot.docs.length === limit,
      lastDocId: snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 3. Claim Item
// -------------------------------------------------------------------------
async function claimItem(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { itemId, message } = input;
    if (!itemId) throw new HttpsError("invalid-argument", "Item ID required");

    const db = admin.firestore();
    const itemDoc = await db.collection("lostAndFound").doc(itemId).get();
    if (!itemDoc.exists) throw new HttpsError("not-found", "Item not found");

    const item = itemDoc.data();
    const conversationId = `lostfound_${itemId}`;
    const conversationRef = db.collection("conversations").doc(conversationId);

    const convSnap = await conversationRef.get();
    if (!convSnap.exists) {
      await conversationRef.set({
        id: conversationId,
        itemType: "lostAndFound",
        itemId,
        itemTitle: item.title,
        participants: [userId, item.posterId],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: message || "I believe this is mine!",
        lastMessageAt: new Date(),
        lastMessageSenderId: userId, // FIX: needed for unread badge in Layout
      });
    }

    await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .add({
        conversationId,
        senderId: userId,
        text: message || "I believe this is mine!",
        type: "claim",
        createdAt: new Date(),
        read: false,
      });

    await conversationRef.update({
      participants: admin.firestore.FieldValue.arrayUnion(userId),
      lastMessage: message || "I believe this is mine!",
      lastMessageAt: new Date(),
      lastMessageSenderId: userId, // FIX: keep in sync on every update
      updatedAt: new Date(),
    });

    return { success: true, conversationId };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 4. Mark Item as Resolved
// -------------------------------------------------------------------------
async function markResolved(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { itemId, claimedBy } = input;
    if (!itemId) throw new HttpsError("invalid-argument", "Item ID required");

    const db = admin.firestore();
    const itemRef = db.collection("lostAndFound").doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) throw new HttpsError("not-found", "Item not found");
    if (itemDoc.data().posterId !== userId) {
      throw new HttpsError("permission-denied", "Only the poster can resolve this item");
    }

    await itemRef.update({
      status: "resolved",
      claimedBy: claimedBy || null,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 5. Get My Posted Items
// -------------------------------------------------------------------------
async function getMyItems(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const db = admin.firestore();
    const snapshot = await db
      .collection("lostAndFound")
      .where("posterId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { items };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

module.exports = { postItem, getItems, claimItem, markResolved, getMyItems };