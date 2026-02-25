/* functions/handlers/adsX.js */
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");
const { logUserAction } = require("../services/analytics");
const { uploadMultipleFiles } = require("../services/storage");
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

async function checkAdminStatus(userId) {
  const db = admin.firestore();
  const doc = await db.collection("admins").doc(userId).get();
  return doc.exists;
}

async function submitServiceRequest(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { serviceType, title, description, budget, timeline, requirements, creativeAssets } = input;

    if (!serviceType || !title || !description) {
      throw new HttpsError("invalid-argument", "Service type, title, and description are required");
    }

    const db = admin.firestore();
    const requestRef = db.collection("serviceRequests").doc();

    let assetUrls = [];
    if (creativeAssets && creativeAssets.length > 0) {
      if (typeof creativeAssets[0] === "string") {
        assetUrls = creativeAssets;
      } else {
        try {
          const uploadResults = await uploadMultipleFiles(creativeAssets, "adsx_assets");
          assetUrls = uploadResults.map((r) => r.url);
        } catch (e) {
          console.error("Asset upload failed:", e);
          assetUrls = [];
        }
      }
    }

    const requestData = {
      id: requestRef.id,
      serviceType: serviceType.toLowerCase(),
      title, description,
      budget: budget ? parseFloat(budget) : 0,
      timeline: timeline || "",
      requirements: requirements || [],
      creativeAssets: assetUrls,
      clientId: userId,
      status: "pending", // pending | in_progress | completed | cancelled
      assignedTo: null,
      promoted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await requestRef.set(requestData);
    try { await logUserAction(userId, "service_request_submitted", { requestId: requestRef.id, serviceType, budget: budget || 0 }); } catch (e) {}
    return { requestId: requestRef.id, ...requestData };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function getRequests(request) {
  try {
    const input = unwrapData(request);
    let userId = getUserId(request);

    if (input.isPublic === true) {
      userId = null;
    } else if (!userId && (input.type === "my_requests" || input.type === "assigned_to_me")) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const db = admin.firestore();
    let query;

    switch (input.type) {
      case "my_requests":    query = db.collection("serviceRequests").where("clientId", "==", userId); break;
      case "assigned_to_me": query = db.collection("serviceRequests").where("assignedTo", "==", userId); break;
      case "pending":        query = db.collection("serviceRequests").where("status", "==", "pending"); break;
      default:               query = db.collection("serviceRequests").where("status", "in", ["active", "in_progress", "open"]); break;
    }

    if (input.serviceType && input.serviceType !== "All") {
      query = query.where("serviceType", "==", input.serviceType.toLowerCase());
    }

    query = query.orderBy("createdAt", "desc");

    if (input.lastDocId) {
      const lastDoc = await db.collection("serviceRequests").doc(input.lastDocId).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    query = query.limit(input.limit || 20);
    const snapshot = await query.get();
    const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
      requests,
      hasMore: snapshot.docs.length === (input.limit || 20),
      lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
    };
  } catch (error) {
    if (error.code === 9 || error.message?.includes("index")) {
      throw new HttpsError("failed-precondition", "Missing Database Index. Check Firebase Console Logs.");
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function updateRequestStatus(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");
    const input = unwrapData(request);
    const { requestId, status, notes } = input;
    if (!requestId || !status) throw new HttpsError("invalid-argument", "Request ID and status required");
    const validStatuses = ["pending", "active", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) throw new HttpsError("invalid-argument", "Invalid status");
    const db = admin.firestore();
    const ref = db.collection("serviceRequests").doc(requestId);
    const doc = await ref.get();
    if (!doc.exists) throw new HttpsError("not-found", "Service request not found");
    const req = doc.data();
    if (req.clientId !== userId && req.assignedTo !== userId && !(await checkAdminStatus(userId))) {
      throw new HttpsError("permission-denied", "Not authorized");
    }
    const updateData = { status, updatedAt: new Date() };
    if (notes) updateData.notes = notes;
    if (status === "completed") updateData.completedAt = new Date();
    await ref.update(updateData);
    try { await logUserAction(userId, "request_status_updated", { requestId, status }); } catch (e) {}
    return { success: true, status };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function assignRequest(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");
    const input = unwrapData(request);
    const { requestId, assignedTo } = input;
    if (!requestId || !assignedTo) throw new HttpsError("invalid-argument", "Request ID and assigned user required");
    if (!(await checkAdminStatus(userId))) throw new HttpsError("permission-denied", "Admin access required");
    const db = admin.firestore();
    const doc = await db.collection("serviceRequests").doc(requestId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Service request not found");
    await db.collection("serviceRequests").doc(requestId).update({ assignedTo, status: "in_progress", assignedAt: new Date(), updatedAt: new Date() });
    try { await logUserAction(userId, "request_assigned", { requestId, assignedTo }); } catch (e) {}
    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function promoteRequest(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");
    const input = unwrapData(request);
    const { requestId } = input;
    if (!requestId) throw new HttpsError("invalid-argument", "Request ID required");
    const db = admin.firestore();
    const doc = await db.collection("serviceRequests").doc(requestId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Service request not found");
    const req = doc.data();
    if (req.clientId !== userId) throw new HttpsError("permission-denied", "Not authorized");
    return await createCheckoutSession({ userId, type: "ads_promotion", itemId: requestId, amount: 1000, description: `Promote: ${req.title}`, successUrl: `${process.env.FRONTEND_URL}/adsx?promoted=true`, cancelUrl: `${process.env.FRONTEND_URL}/adsx/${requestId}` });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function getRequestDetails(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");
    const input = unwrapData(request);
    const { requestId } = input;
    if (!requestId) throw new HttpsError("invalid-argument", "Request ID required");
    const db = admin.firestore();
    const doc = await db.collection("serviceRequests").doc(requestId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Service request not found");
    const req = { id: doc.id, ...doc.data() };
    try { await logUserAction(userId, "request_viewed", { requestId, serviceType: req.serviceType }); } catch (e) {}
    return req;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

async function applyToRequest(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");
    const input = unwrapData(request);
    const { requestId, message } = input;
    if (!requestId) throw new HttpsError("invalid-argument", "Request ID required");
    const db = admin.firestore();
    const doc = await db.collection("serviceRequests").doc(requestId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Gig not found");
    const req = doc.data();
    // Create conversation
const conversationId = `adsx_${requestId}_${userId}_${req.clientId}`;
const conversationRef = db.collection("conversations").doc(conversationId);
const convSnap = await conversationRef.get();

if (!convSnap.exists) {
  await conversationRef.set({
    id: conversationId,
    itemType: "adsx",
    itemId: requestId,
    itemTitle: req.title,
    participants: [userId, req.clientId],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessage: message || "I am interested in this gig!",
    lastMessageAt: new Date(),
    lastMessageSenderId: userId,
  });
}

await conversationRef.collection("messages").add({
  conversationId,
  senderId: userId,
  text: message || "I am interested in this gig!",
  type: "gig_application",
  createdAt: new Date(),
  read: false,
});

// Keep notification for backward compat
await db.collection("notifications").add({
  toUserId: req.clientId,
  fromUserId: userId,
  type: "gig_application",
  message: message || "I am interested in this gig!",
  item: req.title,
  itemId: requestId,
  relatedId: requestId,
  conversationId,
  createdAt: new Date(),
  read: false,
});
    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

module.exports = { submitServiceRequest, getRequests, updateRequestStatus, assignRequest, promoteRequest, getRequestDetails, applyToRequest };