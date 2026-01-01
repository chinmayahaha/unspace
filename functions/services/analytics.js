const admin = require("firebase-admin");

/**
 * Log user action to analytics collection
 * @param {string} userId - User ID
 * @param {string} action - Action performed
 * @param {Object} details - Additional details about the action
 * @param {Object} metadata - Optional metadata
 */
async function logUserAction(userId, action, details = {}, metadata = {}) {
  if (!userId || !action) {
    console.warn("logUserAction: userId and action are required");
    return null;
  }

  const db = admin.firestore();
  const analyticsRef = db.collection("analyticsEvents").doc();

  const analyticsData = {
    userId,
    action,
    details,
    metadata: {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: metadata.userAgent || null,
      ipAddress: metadata.ipAddress || null,
      sessionId: metadata.sessionId || null,
      ...metadata,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await analyticsRef.set(analyticsData);
    console.log(`Analytics logged: ${action} by ${userId}`);
    return analyticsRef.id;
  } catch (error) {
    console.error("Failed to log analytics:", error);
    return null;
  }
}

/**
 * Get analytics events for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of events to retrieve
 * @param {string} action - Optional action filter
 */
async function getUserAnalytics(userId, limit = 50, action = null) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const db = admin.firestore();
  let query = db.collection("analyticsEvents")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit);

  if (action) {
    query = query.where("action", "==", action);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get analytics summary for admin dashboard
 * @param {number} days - Number of days to look back
 */
async function getAnalyticsSummary(days = 30) {
  const db = admin.firestore();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshot = await db.collection("analyticsEvents")
      .where("createdAt", ">=", startDate)
      .get();

  const events = snapshot.docs.map((doc) => doc.data());

  // Group by action
  const actionCounts = {};
  const userCounts = new Set();

  events.forEach((event) => {
    actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    userCounts.add(event.userId);
  });

  return {
    totalEvents: events.length,
    uniqueUsers: userCounts.size,
    actionCounts,
    period: `${days} days`,
  };
}

module.exports = {
  logUserAction,
  getUserAnalytics,
  getAnalyticsSummary,
};
