const admin = require("firebase-admin");
const {logUserAction} = require("../services/analytics");
const {uploadFile} = require("../services/storage");

/**
 * Register a new business
 */
async function registerBusiness(data, context) {
  const {
    name,
    description,
    category,
    contactEmail,
    contactPhone,
    address,
    website,
    socialMedia,
    logoFile,
  } = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!name || !description || !category || !contactEmail) {
    throw new Error("Name, description, category, and contact email are required");
  }

  const db = admin.firestore();
  const businessRef = db.collection("businesses").doc();

  let logoUrl = "";
  if (logoFile) {
    try {
      const uploadResult = await uploadFile(logoFile.buffer, logoFile.name, "businesses", logoFile.type);
      logoUrl = uploadResult.url;
    } catch (error) {
      console.error("Logo upload failed:", error);
      throw new Error("Failed to upload logo");
    }
  }

  const businessData = {
    id: businessRef.id,
    name,
    description,
    category,
    contactEmail,
    contactPhone: contactPhone || "",
    address: address || "",
    website: website || "",
    socialMedia: socialMedia || {},
    logoUrl,
    ownerId: userId,
    status: "active",
    verified: false,
    rating: 0,
    reviewCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await businessRef.set(businessData);

  // Log analytics
  await logUserAction(userId, "business_registered", {
    businessId: businessRef.id,
    name,
    category,
  });

  return {businessId: businessRef.id, ...businessData};
}

/**
 * Get business profile
 */
async function getBusinessProfile(data, context) {
  const {businessId} = data;

  if (!businessId) {
    throw new Error("Business ID is required");
  }

  const db = admin.firestore();
  const businessDoc = await db.collection("businesses").doc(businessId).get();

  if (!businessDoc.exists) {
    throw new Error("Business not found");
  }

  const business = {id: businessDoc.id, ...businessDoc.data()};

  // Log view analytics
  if (context.auth?.uid) {
    await logUserAction(context.auth.uid, "business_viewed", {
      businessId,
      ownerId: business.ownerId,
    });
  }

  return business;
}

/**
 * Get all businesses with filtering
 */
async function getAllBusinesses(data, context) {
  const {
    category,
    searchTerm,
    verified,
    limit = 20,
    lastDocId,
    sortBy = "createdAt",
  } = data;

  const db = admin.firestore();
  let query = db.collection("businesses")
      .where("status", "==", "active");

  // Apply filters
  if (category) {
    query = query.where("category", "==", category);
  }
  if (verified !== undefined) {
    query = query.where("verified", "==", verified);
  }

  // Apply sorting
  const sortField = sortBy === "rating" ? "rating" : "createdAt";
  const sortOrder = sortBy === "rating" ? "desc" : "desc";
  query = query.orderBy(sortField, sortOrder);

  // Pagination
  if (lastDocId) {
    const lastDoc = await db.collection("businesses").doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  let businesses = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Simple text search
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    businesses = businesses.filter((business) =>
      business.name.toLowerCase().includes(searchLower) ||
      business.description.toLowerCase().includes(searchLower) ||
      business.category.toLowerCase().includes(searchLower),
    );
  }

  return {
    businesses,
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
}

/**
 * Update business profile
 */
async function updateBusinessProfile(data, context) {
  const {
    businessId,
    name,
    description,
    category,
    contactEmail,
    contactPhone,
    address,
    website,
    socialMedia,
    logoFile,
  } = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!businessId) {
    throw new Error("Business ID is required");
  }

  const db = admin.firestore();
  const businessRef = db.collection("businesses").doc(businessId);
  const businessDoc = await businessRef.get();

  if (!businessDoc.exists) {
    throw new Error("Business not found");
  }

  const business = businessDoc.data();
  if (business.ownerId !== userId) {
    throw new Error("Not authorized to update this business");
  }

  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (category) updateData.category = category;
  if (contactEmail) updateData.contactEmail = contactEmail;
  if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
  if (address !== undefined) updateData.address = address;
  if (website !== undefined) updateData.website = website;
  if (socialMedia) updateData.socialMedia = socialMedia;

  // Handle logo update
  if (logoFile) {
    try {
      const uploadResult = await uploadFile(logoFile.buffer, logoFile.name, "businesses", logoFile.type);
      updateData.logoUrl = uploadResult.url;
    } catch (error) {
      console.error("Logo upload failed:", error);
      throw new Error("Failed to upload logo");
    }
  }

  await businessRef.update(updateData);

  // Log analytics
  await logUserAction(userId, "business_updated", {
    businessId,
    changes: Object.keys(updateData),
  });

  return {success: true, businessId};
}

/**
 * Add a review for a business
 */
async function addReview(data, context) {
  const {businessId, rating, comment} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!businessId || !rating) {
    throw new Error("Business ID and rating are required");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const db = admin.firestore();

  // Verify business exists
  const businessDoc = await db.collection("businesses").doc(businessId).get();
  if (!businessDoc.exists) {
    throw new Error("Business not found");
  }

  const business = businessDoc.data();
  if (business.ownerId === userId) {
    throw new Error("Cannot review your own business");
  }

  // Check if user already reviewed this business
  const existingReviewQuery = await db.collection("reviews")
      .where("businessId", "==", businessId)
      .where("userId", "==", userId)
      .get();

  if (!existingReviewQuery.empty) {
    throw new Error("You have already reviewed this business");
  }

  const reviewRef = db.collection("reviews").doc();
  const reviewData = {
    id: reviewRef.id,
    businessId,
    userId,
    rating: parseInt(rating),
    comment: comment || "",
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await reviewRef.set(reviewData);

  // Update business rating
  const businessRef = db.collection("businesses").doc(businessId);
  await businessRef.update({
    reviewCount: admin.firestore.FieldValue.increment(1),
  });

  // Recalculate average rating
  const reviewsSnapshot = await db.collection("reviews")
      .where("businessId", "==", businessId)
      .where("status", "==", "active")
      .get();

  const reviews = reviewsSnapshot.docs.map((doc) => doc.data());
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await businessRef.update({
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
  });

  // Log analytics
  await logUserAction(userId, "review_added", {
    reviewId: reviewRef.id,
    businessId,
    rating: parseInt(rating),
  });

  return {reviewId: reviewRef.id, ...reviewData};
}

/**
 * Get reviews for a business
 */
async function getReviews(data, context) {
  const {businessId, limit = 20, lastDocId} = data;

  if (!businessId) {
    throw new Error("Business ID is required");
  }

  const db = admin.firestore();
  let query = db.collection("reviews")
      .where("businessId", "==", businessId)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc");

  if (lastDocId) {
    const lastDoc = await db.collection("reviews").doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const reviews = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    reviews,
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
}

/**
 * Verify a business (admin only)
 */
async function verifyBusiness(data, context) {
  const {businessId, verified} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  // Check if user is admin
  const db = admin.firestore();
  const adminDoc = await db.collection("admins").doc(userId).get();
  if (!adminDoc.exists) {
    throw new Error("Admin access required");
  }

  if (!businessId) {
    throw new Error("Business ID is required");
  }

  const businessRef = db.collection("businesses").doc(businessId);
  const businessDoc = await businessRef.get();

  if (!businessDoc.exists) {
    throw new Error("Business not found");
  }

  await businessRef.update({
    verified: verified === true,
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    verifiedBy: userId,
  });

  // Log analytics
  await logUserAction(userId, "business_verification", {
    businessId,
    verified: verified === true,
  });

  return {success: true, verified: verified === true};
}

module.exports = {
  registerBusiness,
  getBusinessProfile,
  getAllBusinesses,
  updateBusinessProfile,
  addReview,
  getReviews,
  verifyBusiness,
};
