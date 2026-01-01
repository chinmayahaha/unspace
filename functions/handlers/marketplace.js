const admin = require("firebase-admin");
const {logUserAction} = require("../services/analytics");
const {uploadMultipleFiles} = require("../services/storage");
const {createCheckoutSession} = require("../services/payments");

/**
 * Create basic user profile when a new user signs up (called from auth onCreate trigger)
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
      photoURL: userRecord.photoURL || null,
      providerData: userRecord.providerData || [],
      preferences: {
        notifications: true,
        emailUpdates: true,
        privacy: "public",
      },
      stats: {
        listingsCount: 0,
        exchangesCount: 0,
        postsCount: 0,
        reviewsCount: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await profileRef.set(profileData, {merge: true});

    // Log analytics (best-effort)
    try {
      await logUserAction(uid, "user_created", {email: profileData.email});
    } catch (e) {
      console.warn("Failed to log analytics for user creation", e.message || e);
    }

    return {success: true, userId: uid};
  } catch (error) {
    console.error("createUserProfile error:", error);
    return {success: false, error: error.message || String(error)};
  }
}

/**
 * Create a new marketplace listing
 */
async function createListing(data, context) {
  const {title, description, price, category, condition, images} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!title || !price || !category) {
    throw new Error("Title, price, and category are required");
  }

  const db = admin.firestore();
  const listingRef = db.collection("listings").doc();

  let imageUrls = [];
  if (images && images.length > 0) {
    try {
      const uploadResults = await uploadMultipleFiles(images, "listings");
      imageUrls = uploadResults.map((result) => result.url);
    } catch (error) {
      console.error("Image upload failed:", error);
      throw new Error("Failed to upload images");
    }
  }

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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await listingRef.set(listingData);

  // Log analytics
  await logUserAction(userId, "listing_created", {
    listingId: listingRef.id,
    category,
    price: parseFloat(price),
  });

  // Trigger AI description generation
  await db.collection("aiTasks").doc().set({
    type: "generateListingDescription",
    listingId: listingRef.id,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {listingId: listingRef.id, ...listingData};
}

/**
 * Get a single listing by ID
 */
async function getListing(data, context) {
  const {listingId} = data;

  if (!listingId) {
    throw new Error("Listing ID is required");
  }

  const db = admin.firestore();
  const listingDoc = await db.collection("listings").doc(listingId).get();

  if (!listingDoc.exists) {
    throw new Error("Listing not found");
  }

  const listing = {id: listingDoc.id, ...listingDoc.data()};

  // Log view analytics
  if (context.auth?.uid) {
    await logUserAction(context.auth.uid, "listing_viewed", {
      listingId,
      sellerId: listing.sellerId,
    });
  }

  return listing;
}

/**
 * Get all listings with filtering and pagination
 */
async function getAllListings(data, context) {
  const {
    category,
    minPrice,
    maxPrice,
    condition,
    searchTerm,
    limit = 20,
    lastDocId,
  } = data;

  const db = admin.firestore();
  let query = db.collection("listings")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc");

  // Apply filters
  if (category) {
    query = query.where("category", "==", category);
  }
  if (condition) {
    query = query.where("condition", "==", condition);
  }
  if (minPrice !== undefined) {
    query = query.where("price", ">=", parseFloat(minPrice));
  }
  if (maxPrice !== undefined) {
    query = query.where("price", "<=", parseFloat(maxPrice));
  }

  // Pagination
  if (lastDocId) {
    const lastDoc = await db.collection("listings").doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const listings = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Simple text search if searchTerm provided
  let filteredListings = listings;
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredListings = listings.filter((listing) =>
      listing.title.toLowerCase().includes(searchLower) ||
      listing.description.toLowerCase().includes(searchLower),
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
  const {listingId, title, description, price, category, condition, images} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!listingId) {
    throw new Error("Listing ID is required");
  }

  const db = admin.firestore();
  const listingRef = db.collection("listings").doc(listingId);
  const listingDoc = await listingRef.get();

  if (!listingDoc.exists) {
    throw new Error("Listing not found");
  }

  const listing = listingDoc.data();
  if (listing.sellerId !== userId) {
    throw new Error("Not authorized to update this listing");
  }

  let imageUrls = listing.images || [];
  if (images && images.length > 0) {
    try {
      const uploadResults = await uploadMultipleFiles(images, "listings");
      imageUrls = uploadResults.map((result) => result.url);
    } catch (error) {
      console.error("Image upload failed:", error);
      throw new Error("Failed to upload images");
    }
  }

  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (price) updateData.price = parseFloat(price);
  if (category) updateData.category = category;
  if (condition) updateData.condition = condition;
  if (images) updateData.images = imageUrls;

  await listingRef.update(updateData);

  // Log analytics
  await logUserAction(userId, "listing_updated", {
    listingId,
    changes: Object.keys(updateData),
  });

  return {success: true, listingId};
}

/**
 * Delete a listing
 */
async function deleteListing(data, context) {
  const {listingId} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!listingId) {
    throw new Error("Listing ID is required");
  }

  const db = admin.firestore();
  const listingRef = db.collection("listings").doc(listingId);
  const listingDoc = await listingRef.get();

  if (!listingDoc.exists) {
    throw new Error("Listing not found");
  }

  const listing = listingDoc.data();
  if (listing.sellerId !== userId) {
    throw new Error("Not authorized to delete this listing");
  }

  await listingRef.update({
    status: "deleted",
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Log analytics
  await logUserAction(userId, "listing_deleted", {
    listingId,
    category: listing.category,
  });

  return {success: true};
}

/**
 * Contact seller about a listing
 */
async function contactSeller(data, context) {
  const {listingId, message} = data;
  const buyerId = context.auth?.uid;

  if (!buyerId) {
    throw new Error("Authentication required");
  }

  if (!listingId) {
    throw new Error("Listing ID is required");
  }

  const db = admin.firestore();

  // Get listing details
  const listingDoc = await db.collection("listings").doc(listingId).get();
  if (!listingDoc.exists) {
    throw new Error("Listing not found");
  }

  const listing = listingDoc.data();

  // Create interest record
  const interestRef = db.collection("listing_interests").doc();
  await interestRef.set({
    listingId,
    buyerId,
    sellerId: listing.sellerId,
    message: message || "",
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Log analytics
  await logUserAction(buyerId, "seller_contacted", {
    listingId,
    sellerId: listing.sellerId,
  });

  return {success: true, interestId: interestRef.id};
}

/**
 * Feature a listing (paid service)
 */
async function featureListing(data, context) {
  const {listingId} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!listingId) {
    throw new Error("Listing ID is required");
  }

  const db = admin.firestore();
  const listingDoc = await db.collection("listings").doc(listingId).get();

  if (!listingDoc.exists) {
    throw new Error("Listing not found");
  }

  const listing = listingDoc.data();
  if (listing.sellerId !== userId) {
    throw new Error("Not authorized to feature this listing");
  }

  // Create checkout session for featuring
  const checkoutSession = await createCheckoutSession({
    userId,
    type: "listing_featured",
    itemId: listingId,
    amount: 500, // $5.00 in cents
    description: `Feature listing: ${listing.title}`,
    successUrl: `${process.env.FRONTEND_URL}/marketplace?featured=true`,
    cancelUrl: `${process.env.FRONTEND_URL}/marketplace/${listingId}`,
  });

  return checkoutSession;
}

module.exports = {
  createListing,
  getListing,
  getAllListings,
  updateListing,
  deleteListing,
  contactSeller,
  featureListing,
  createUserProfile,
};
