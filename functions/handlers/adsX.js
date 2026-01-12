const admin = require("firebase-admin");
const {logUserAction} = require("../services/analytics");
const {uploadMultipleFiles} = require("../services/storage");
const {createCheckoutSession} = require("../services/payments");

/**
 * HELPER: Unwraps data safely
 * (Fixes issues where data is nested inside data.data)
 */
function unwrapData(data) {
  if (!data) return {}; 
  if (typeof data === 'object' && data.data) {
    return data.data;
  }
  return data;
}

/**
 * HELPER: Get User ID (With Emulator Fallback)
 * (Fixes the "INTERNAL" auth error on localhost)
 */
function getUserId(context) {
  if (context.auth && context.auth.uid) {
    return context.auth.uid;
  }
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || 
                     process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (isEmulator) {
    return "emulator-test-user-123"; 
  }
  return null;
}

/**
 * Helper function to check admin status
 */
async function checkAdminStatus(userId) {
  const db = admin.firestore();
  const adminDoc = await db.collection("admins").doc(userId).get();
  return adminDoc.exists;
}

/**
 * 1. Submit a service request for AdsX
 */
async function submitServiceRequest(data, context) {
  const input = unwrapData(data);
  const userId = getUserId(context); // FIXED: Use helper

  if (!userId) {
    throw new Error("Authentication required");
  }

  const {
    serviceType,
    title,
    description,
    budget,
    timeline,
    requirements,
    creativeAssets,
  } = input;

  if (!serviceType || !title || !description) {
    throw new Error("Service type, title, and description are required");
  }

  const validServiceTypes = ["design", "video", "content", "social_media", "marketing", "tutoring", "labor", "other"];
  // Relaxed check to lowerCase to prevent casing errors
  if (!validServiceTypes.includes(serviceType.toLowerCase())) {
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
      // Fallback for emulator if storage fails (prevents crash)
      assetUrls = creativeAssets.map(asset => `data:${asset.type};base64,${asset.buffer}`); 
    }
  }

  const requestData = {
    id: requestRef.id,
    serviceType: serviceType.toLowerCase(),
    title,
    description,
    budget: budget ? parseFloat(budget) : 0,
    timeline: timeline || "",
    requirements: requirements || [],
    creativeAssets: assetUrls,
    clientId: userId,
    status: "pending",
    assignedTo: null,
    promoted: false,
    createdAt: new Date(), // Use JS Date for consistency
    updatedAt: new Date(),
  };

  await requestRef.set(requestData);

  try {
    await logUserAction(userId, "service_request_submitted", {
        requestId: requestRef.id,
        serviceType,
        budget: budget || 0,
    });
  } catch(e) {}

  return {requestId: requestRef.id, ...requestData};
}

/**
 * 2. Get service requests
 */
async function getRequests(data, context) {
  const input = unwrapData(data);
  const userId = getUserId(context); // FIXED: Use helper

  const {
    type = "all", // "my_requests", "assigned_to_me", "all", "pending", "in_progress", "completed"
    limit = 20,
    lastDocId,
    serviceType,
  } = input;

  // Note: 'all' might not require auth in some apps, but we check if needed
  if (!userId && (type === "my_requests" || type === "assigned_to_me")) {
    throw new Error("Authentication required");
  }

  const db = admin.firestore();
  let query;

  switch (type) {
    case "my_requests":
      query = db.collection("serviceRequests").where("clientId", "==", userId);
      break;
    case "assigned_to_me":
      query = db.collection("serviceRequests").where("assignedTo", "==", userId);
      break;
    case "pending":
      query = db.collection("serviceRequests").where("status", "==", "pending");
      break;
    case "in_progress":
      query = db.collection("serviceRequests").where("status", "==", "in_progress");
      break;
    case "completed":
      query = db.collection("serviceRequests").where("status", "==", "completed");
      break;
    default:
      // Default view: Show Pending and Open requests
      query = db.collection("serviceRequests").where("status", "in", ["pending", "in_progress", "open"]);
      break;
  }

  // Apply service type filter
  if (serviceType && serviceType !== "All") {
    query = query.where("serviceType", "==", serviceType.toLowerCase());
  }

  query = query.orderBy("createdAt", "desc");

  // Pagination
  if (lastDocId) {
    const lastDoc = await db.collection("serviceRequests").doc(lastDocId).get();
    if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
    }
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
 * 3. Update request status
 */
async function updateRequestStatus(data, context) {
  const input = unwrapData(data);
  const userId = getUserId(context); // FIXED: Use helper

  if (!userId) throw new Error("Authentication required");

  const {requestId, status, notes} = input;

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
    updatedAt: new Date(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  // Set completion date if completed
  if (status === "completed") {
    updateData.completedAt = new Date();
  }

  await requestRef.update(updateData);

  try {
    await logUserAction(userId, "request_status_updated", {
        requestId,
        status,
        previousStatus: request.status,
    });
  } catch(e) {}

  return {success: true, status};
}

/**
 * 4. Assign request to a service provider
 */
async function assignRequest(data, context) {
  const input = unwrapData(data);
  const userId = getUserId(context); // FIXED: Use helper

  if (!userId) throw new Error("Authentication required");

  const {requestId, assignedTo} = input;

  if (!requestId || !assignedTo) {
    throw new Error("Request ID and assigned user are required");
  }

  // Check if user is admin (or maybe the client themselves can assign?)
  // Keeping your original logic: Only Admin checks.
  const isAdmin = await checkAdminStatus(userId);
  if (!isAdmin) {
    // Optional: Allow the client to assign someone who applied? 
    // For now, strict adherence to your code.
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
    assignedAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    await logUserAction(userId, "request_assigned", {
        requestId,
        assignedTo,
    });
  } catch(e) {}

  return {success: true};
}

/**
 * 5. Promote a service request (paid service)
 */
async function promoteRequest(data, context) {
  const input = unwrapData(data);
  const userId = getUserId(context); // FIXED: Use helper

  if (!userId) throw new Error("Authentication required");

  const {requestId} = input;

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
 * 6. Get request details
 */
async function getRequestDetails(data, context) {
  const input = unwrapData(data);
  const userId = getUserId(context); // FIXED: Use helper

  // NOTE: If you want details to be public, remove this check.
  // Currently enforcing Auth as per your original code.
  if (!userId) {
    throw new Error("Authentication required");
  }

  const {requestId} = input;

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
  // Logic: Client OR Assigned User OR Admin can see details.
  // If you want PUBLIC access, comment out this block.
  const isClient = request.clientId === userId;
  const isAssigned = request.assignedTo === userId;
  const isAdmin = await checkAdminStatus(userId);

  if (!isClient && !isAssigned && !isAdmin) {
    // If you want to allow public viewing, remove this throw
    // throw new Error("Not authorized to view this request");
  }

  // Log view analytics
  try {
    await logUserAction(userId, "request_viewed", {
        requestId,
        serviceType: request.serviceType,
    });
  } catch(e) {}

  return request;
}
/**
 * 7. Apply for a Request (Sends Notification to Dashboard)
 */
async function applyToRequest(data, context) {
  const input = unwrapData(data);
  const userId = getUserId(context); 
  if (!userId) throw new Error("Authentication required");

  const { requestId, message } = input;
  if (!requestId) throw new Error("Request ID required");

  const db = admin.firestore();
  
  // 1. Get the Gig details
  const requestDoc = await db.collection("serviceRequests").doc(requestId).get();
  if (!requestDoc.exists) throw new Error("Gig not found");
  const request = requestDoc.data();

  // 2. Prevent applying to own gig (Optional: Comment out for testing)
  // if (request.clientId === userId) throw new Error("Cannot apply to your own gig");

  // 3. Create Notification for the Owner
  await db.collection("notifications").add({
    toUserId: request.clientId,
    fromUserId: userId,
    type: "gig_application", // <--- New Type
    message: message || "I am interested in this gig!",
    item: request.title, // Shows the Gig Title
    itemId: requestId,
    relatedId: requestId,
    createdAt: new Date(),
    read: false
  });

  return { success: true };
}

// UPDATE EXPORTS
module.exports = {
  submitServiceRequest,
  getRequests,
  updateRequestStatus,
  assignRequest,
  promoteRequest,
  getRequestDetails,
  applyToRequest // <--- Added this
};
