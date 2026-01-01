const admin = require("firebase-admin");
const {logUserAction} = require("../services/analytics");
const {uploadMultipleFiles} = require("../services/storage");
const {createCheckoutSession} = require("../services/payments");

/**
 * Submit a service request for AdsX
 */
async function submitServiceRequest(data, context) {
  const {
    serviceType,
    title,
    description,
    budget,
    timeline,
    requirements,
    creativeAssets,
  } = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!serviceType || !title || !description) {
    throw new Error("Service type, title, and description are required");
  }

  const validServiceTypes = ["design", "video", "content", "social_media", "marketing"];
  if (!validServiceTypes.includes(serviceType)) {
    throw new Error("Invalid service type");
  }

  const db = admin.firestore();
  const requestRef = db.collection("serviceRequests").doc();

  let assetUrls = [];
  if (creativeAssets && creativeAssets.length > 0) {
    try {
      const uploadResults = await uploadMultipleFiles(creativeAssets, "adsx_assets");
      assetUrls = uploadResults.map((result) => result.url);
    } catch (error) {
      console.error("Asset upload failed:", error);
      throw new Error("Failed to upload creative assets");
    }
  }

  const requestData = {
    id: requestRef.id,
    serviceType,
    title,
    description,
    budget: budget || 0,
    timeline: timeline || "",
    requirements: requirements || [],
    creativeAssets: assetUrls,
    clientId: userId,
    status: "pending",
    assignedTo: null,
    promoted: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await requestRef.set(requestData);

  // Log analytics
  await logUserAction(userId, "service_request_submitted", {
    requestId: requestRef.id,
    serviceType,
    budget: budget || 0,
  });

  return {requestId: requestRef.id, ...requestData};
}

/**
 * Get service requests
 */
async function getRequests(data, context) {
  const {
    type = "all", // "my_requests", "assigned_to_me", "all", "pending", "in_progress", "completed"
    limit = 20,
    lastDocId,
    serviceType,
  } = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  const db = admin.firestore();
  let query;

  switch (type) {
    case "my_requests":
      query = db.collection("serviceRequests")
          .where("clientId", "==", userId);
      break;
    case "assigned_to_me":
      query = db.collection("serviceRequests")
          .where("assignedTo", "==", userId);
      break;
    case "pending":
      query = db.collection("serviceRequests")
          .where("status", "==", "pending");
      break;
    case "in_progress":
      query = db.collection("serviceRequests")
          .where("status", "==", "in_progress");
      break;
    case "completed":
      query = db.collection("serviceRequests")
          .where("status", "==", "completed");
      break;
    default:
      query = db.collection("serviceRequests");
      break;
  }

  // Apply service type filter
  if (serviceType) {
    query = query.where("serviceType", "==", serviceType);
  }

  query = query.orderBy("createdAt", "desc");

  // Pagination
  if (lastDocId) {
    const lastDoc = await db.collection("serviceRequests").doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const requests = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    requests,
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
}

/**
 * Update request status
 */
async function updateRequestStatus(data, context) {
  const {requestId, status, notes} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!requestId || !status) {
    throw new Error("Request ID and status are required");
  }

  const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const db = admin.firestore();
  const requestRef = db.collection("serviceRequests").doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new Error("Service request not found");
  }

  const request = requestDoc.data();

  // Check permissions
  const isClient = request.clientId === userId;
  const isAssigned = request.assignedTo === userId;
  const isAdmin = await checkAdminStatus(userId);

  if (!isClient && !isAssigned && !isAdmin) {
    throw new Error("Not authorized to update this request");
  }

  const updateData = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  // Set completion date if completed
  if (status === "completed") {
    updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await requestRef.update(updateData);

  // Log analytics
  await logUserAction(userId, "request_status_updated", {
    requestId,
    status,
    previousStatus: request.status,
  });

  return {success: true, status};
}

/**
 * Assign request to a service provider
 */
async function assignRequest(data, context) {
  const {requestId, assignedTo} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!requestId || !assignedTo) {
    throw new Error("Request ID and assigned user are required");
  }

  // Check if user is admin
  const isAdmin = await checkAdminStatus(userId);
  if (!isAdmin) {
    throw new Error("Admin access required");
  }

  const db = admin.firestore();
  const requestRef = db.collection("serviceRequests").doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new Error("Service request not found");
  }

  await requestRef.update({
    assignedTo,
    status: "in_progress",
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Log analytics
  await logUserAction(userId, "request_assigned", {
    requestId,
    assignedTo,
  });

  return {success: true};
}

/**
 * Promote a service request (paid service)
 */
async function promoteRequest(data, context) {
  const {requestId} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!requestId) {
    throw new Error("Request ID is required");
  }

  const db = admin.firestore();
  const requestDoc = await db.collection("serviceRequests").doc(requestId).get();

  if (!requestDoc.exists) {
    throw new Error("Service request not found");
  }

  const request = requestDoc.data();
  if (request.clientId !== userId) {
    throw new Error("Not authorized to promote this request");
  }

  // Create checkout session for promotion
  const checkoutSession = await createCheckoutSession({
    userId,
    type: "ads_promotion",
    itemId: requestId,
    amount: 1000, // $10.00 in cents
    description: `Promote service request: ${request.title}`,
    successUrl: `${process.env.FRONTEND_URL}/adsx?promoted=true`,
    cancelUrl: `${process.env.FRONTEND_URL}/adsx/${requestId}`,
  });

  return checkoutSession;
}

/**
 * Get request details
 */
async function getRequestDetails(data, context) {
  const {requestId} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!requestId) {
    throw new Error("Request ID is required");
  }

  const db = admin.firestore();
  const requestDoc = await db.collection("serviceRequests").doc(requestId).get();

  if (!requestDoc.exists) {
    throw new Error("Service request not found");
  }

  const request = {id: requestDoc.id, ...requestDoc.data()};

  // Check permissions
  const isClient = request.clientId === userId;
  const isAssigned = request.assignedTo === userId;
  const isAdmin = await checkAdminStatus(userId);

  if (!isClient && !isAssigned && !isAdmin) {
    throw new Error("Not authorized to view this request");
  }

  // Log view analytics
  await logUserAction(userId, "request_viewed", {
    requestId,
    serviceType: request.serviceType,
  });

  return request;
}

/**
 * Helper function to check admin status
 */
async function checkAdminStatus(userId) {
  const db = admin.firestore();
  const adminDoc = await db.collection("admins").doc(userId).get();
  return adminDoc.exists;
}

module.exports = {
  submitServiceRequest,
  getRequests,
  updateRequestStatus,
  assignRequest,
  promoteRequest,
  getRequestDetails,
};
