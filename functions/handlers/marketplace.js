const admin = require("firebase-admin");
const {logUserAction} = require("../services/analytics");
const {uploadMultipleFiles} = require("../services/storage");
const {createCheckoutSession} = require("../services/payments");

/**
 * HELPER: Unwraps data safely
 */
function unwrapData(data) {
  if (!data) return {}; 
  if (typeof data === 'object' && data.data) {
    return data.data;
  }
  return data;
}

/**
 * HELPER: Gets User ID safely
 */
/**
 * HELPER: Gets User ID safely
 */
function getUserId(context) {
  // 1. Log what the backend sees (Check your VS Code Terminal for this!)
  console.log("Auth Debug:", context.auth ? "User is " + context.auth.uid : "No Auth Token");

  // 2. Try real Auth
  if (context.auth && context.auth.uid) {
    return context.auth.uid;
  }

  // 3. EMULATOR FALLBACK (Restored but logged)
  // If you are on localhost and Auth fails, we return a fallback ID so you don't crash.
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || 
                     process.env.FIREBASE_AUTH_EMULATOR_HOST;
  
  if (isEmulator) {
    console.warn("⚠️ EMULATOR: Using fallback user ID because real Auth failed.");
    return "emulator-test-user-123"; 
  }

  return null;
}

/**
 * Create basic user profile
 */
async function createUserProfile(userRecord) {
  try {
    const db = admin.firestore();
    const uid = userRecord.uid || userRecord.id;
    const profileRef = db.collection("users").doc(uid);

    const profileData = {
      id: uid,
      email: userRecord.email || null,
      name: userRecord.displayName || (userRecord.email ? userRecord.email.split("@")[0] : "Student"),
      createdAt: new Date(), 
      updatedAt: new Date(),
    };

    await profileRef.set(profileData, {merge: true});
    return {success: true, userId: uid};
  } catch (error) {
    console.error("createUserProfile error:", error);
    return {success: false, error: error.message};
  }
}

/**
 * Create a new marketplace listing
 */
async function createListing(data, context) {
  const userId = getUserId(context);
  if (!userId) {
    throw new Error("Authentication required: Unable to verify user.");
  }

  const input = unwrapData(data);
  const {title, description, price, category, condition, images} = input;

  if (!title || !price || !category) {
    throw new Error(`Missing fields! Received: Title=${title}, Price=${price}, Category=${category}`);
  }

  const db = admin.firestore();
  const listingRef = db.collection("listings").doc();
  const imageUrls = images || [];

  const listingData = {
    id: listingRef.id,
    title,
    description: description || "",
    price: parseFloat(price),
    category,
    condition: condition || "good",
    images: imageUrls,
    sellerId: userId,
    status: "active",
    featured: false,
    createdAt: new Date(), 
    updatedAt: new Date(),
  };

  await listingRef.set(listingData);

  try {
      await logUserAction(userId, "listing_created", {
        listingId: listingRef.id,
        category,
        price: parseFloat(price),
      });
  } catch (err) { }

  return {listingId: listingRef.id, ...listingData};
}

/**
 * Get a single listing
 */
async function getListing(data, context) {
  const input = unwrapData(data);
  const {listingId} = input;

  if (!listingId) throw new Error("Listing ID is required");

  const db = admin.firestore();
  const listingDoc = await db.collection("listings").doc(listingId).get();

  if (!listingDoc.exists) throw new Error("Listing not found");

  return {id: listingDoc.id, ...listingDoc.data()};
}

/**
 * Get listings for the CURRENT USER (Dashboard)
 * NEW FUNCTION: This was missing and causing your dashboard issues.
 */
async function getUserListings(data, context) {
  const userId = getUserId(context);
  if (!userId) throw new Error("Authentication required");

  const db = admin.firestore();
  
  // Fetch listings where sellerId matches the current user
  const query = db.collection("listings")
      .where("sellerId", "==", userId)
      .where("status", "in", ["active", "sold"])
      .orderBy("createdAt", "desc");

  const snapshot = await query.get();
  const listings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return { listings };
}

/**
 * Get all listings (Marketplace Feed)
 * FIXED: Added NaN checks to prevent emulator/production crashes.
 */
async function getAllListings(data, context) {
  const input = unwrapData(data);
  const { category, minPrice, maxPrice, condition, searchTerm, limit = 20, lastDocId } = input;

  const db = admin.firestore();
  let query = db.collection("listings")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc");

  if (category) query = query.where("category", "==", category);
  if (condition) query = query.where("condition", "==", condition);
  
  // FIX: Safety check for NaN
  if (minPrice !== undefined && minPrice !== null) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) query = query.where("price", ">=", min);
  }

  // FIX: Safety check for NaN
  if (maxPrice !== undefined && maxPrice !== null) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) query = query.where("price", "<=", max);
  }

  if (lastDocId) {
    const lastDoc = await db.collection("listings").doc(lastDocId).get();
    if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
    }
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const listings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Text Search (Client-side filtering)
  let filteredListings = listings;
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredListings = listings.filter((listing) =>
      listing.title.toLowerCase().includes(searchLower) ||
      listing.description.toLowerCase().includes(searchLower)
    );
  }

  return {
    listings: filteredListings,
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
}

/**
 * Update a listing
 */
async function updateListing(data, context) {
  const input = unwrapData(data);
  const {listingId, title, description, price, category, condition, images} = input;
  
  const userId = getUserId(context);
  if (!userId) throw new Error("Authentication required");
  if (!listingId) throw new Error("Listing ID is required");

  const db = admin.firestore();
  const listingRef = db.collection("listings").doc(listingId);
  const listingDoc = await listingRef.get();

  if (!listingDoc.exists) throw new Error("Listing not found");

  const listing = listingDoc.data();
  if (listing.sellerId !== userId) {
    throw new Error("Not authorized to update this listing");
  }

  const updateData = { updatedAt: new Date() };
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (price) updateData.price = parseFloat(price);
  if (category) updateData.category = category;
  if (condition) updateData.condition = condition;
  if (images) updateData.images = images;

  await listingRef.update(updateData);
  return {success: true, listingId};
}

/**
 * Delete a listing
 */
async function deleteListing(data, context) {
  const input = unwrapData(data);
  const {listingId} = input;
  
  const userId = getUserId(context);
  if (!userId) throw new Error("Authentication required");

  const db = admin.firestore();
  const listingRef = db.collection("listings").doc(listingId);
  const listingDoc = await listingRef.get();

  if (!listingDoc.exists) throw new Error("Listing not found");

  if (listingDoc.data().sellerId !== userId) {
    throw new Error("Not authorized to delete this listing");
  }

  await listingRef.update({
    status: "deleted",
    deletedAt: new Date(), 
  });

  return {success: true};
}

/**
 * Contact Seller & Send Notification
 */
async function contactSeller(data, context) {
  const input = unwrapData(data);
  const {listingId, message} = input;
  
  const buyerId = getUserId(context);
  if (!buyerId) throw new Error("Authentication required");

  const db = admin.firestore();
  const listingDoc = await db.collection("listings").doc(listingId).get();
  
  if (!listingDoc.exists) throw new Error("Listing not found");
  const listing = listingDoc.data();

  // 1. Save the message in the database (The "Chat")
  const interestRef = db.collection("listing_interests").doc();
  await interestRef.set({
    listingId,
    buyerId,
    sellerId: listing.sellerId,
    message: message || "",
    status: "pending",
    createdAt: new Date(), 
  });

  // 2. NEW: Send a Notification so it appears on the Dashboard!
  // This connects the "Contact" button to the "Notifications" panel.
  await db.collection("notifications").add({
    toUserId: listing.sellerId, // Send to the seller
    fromUserId: buyerId,        // From the buyer
    type: "buy_request",
    message: message || "I'm interested in this item!",
    item: listing.title,
    itemId: listingId,
    createdAt: new Date(),
    read: false
  });

  return {success: true, interestId: interestRef.id};
}
/**
 * Feature Listing
 */
async function featureListing(data, context) {
  const input = unwrapData(data);
  const {listingId} = input;
  
  const userId = getUserId(context);
  if (!userId) throw new Error("Authentication required");

  const db = admin.firestore();
  const listingDoc = await db.collection("listings").doc(listingId).get();

  if (!listingDoc.exists) throw new Error("Listing not found");
  if (listingDoc.data().sellerId !== userId) throw new Error("Not authorized");

  const checkoutSession = await createCheckoutSession({
    userId,
    type: "listing_featured",
    itemId: listingId,
    amount: 500,
    description: `Feature listing: ${listingDoc.data().title}`,
    successUrl: `${process.env.FRONTEND_URL}/marketplace?featured=true`,
    cancelUrl: `${process.env.FRONTEND_URL}/marketplace/${listingId}`,
  });

  return checkoutSession;
}

module.exports = {
  createListing,
  getListing,
  getAllListings,
  getUserListings, // <--- EXPORTED NEW FUNCTION
  updateListing,
  deleteListing,
  contactSeller,
  featureListing,
  createUserProfile,
};