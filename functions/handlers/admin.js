/* functions/handlers/admin.js */
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

const DEPLOYMENT_SECRET = "UNi]BoVI&%qw)rJ!Ma+eW)4";

// -------------------------------------------------------------------------
// HELPER: Verify admin from callable context
// -------------------------------------------------------------------------
function unwrapData(dataOrRequest) {
  const data = dataOrRequest?.data ?? dataOrRequest;
  if (!data) return {};
  if (typeof data === "object" && data.data) return data.data;
  return data;
}

async function verifyAdmin(dataOrRequest, context) {
  const auth = context?.auth || dataOrRequest?.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // Check custom claim first (fast path)
  if (auth.token.admin === true) return true;

  // Fallback: check Firestore
  const uid = auth.uid;
  const db = admin.firestore();
  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists || userDoc.data().role !== "admin") {
    console.warn(`Unauthorized Admin Access Attempt by: ${uid}`);
    throw new HttpsError("permission-denied", "ACCESS DENIED: Admins only.");
  }

  // Auto-repair: set custom claim if missing
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  return true;
}

// -------------------------------------------------------------------------
// 1. Get Admin Stats
// -------------------------------------------------------------------------
exports.getAdminStats = async (data, context) => {
  try {
    await verifyAdmin(request);
    const db = admin.firestore();

    const [usersSnap, listingsSnap, booksSnap, adsSnap, reportsSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("listings").get(),
      db.collection("books").get(),
      db.collection("serviceRequests").get(),
      db.collection("reports").get(),
    ]);

    return {
      totalUsers: usersSnap.size,
      totalListings: listingsSnap.size,
      totalBooks: booksSnap.size,
      totalAds: adsSnap.size,
      pendingReports: reportsSnap.size,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
};

// -------------------------------------------------------------------------
// 2. Get All Users
// -------------------------------------------------------------------------
exports.getAllUsers = async (data, context) => {
  try {
    await verifyAdmin(request);
    const db = admin.firestore();
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").limit(50).get();
    return { users: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
};

// -------------------------------------------------------------------------
// 3. Ban User
// -------------------------------------------------------------------------
exports.banUser = async (data, context) => {
  try {
    await verifyAdmin(data, context);
    const { targetUserId, ban } = unwrapData(data);
    const db = admin.firestore();

    await db.collection("users").doc(targetUserId).update({
      isBanned: ban,
      bannedAt: ban ? new Date() : null,
    });

    if (ban) {
      try {
        await admin.auth().revokeRefreshTokens(targetUserId);
      } catch (e) {
        console.error("Failed to revoke tokens", e);
      }
    }

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
};

// -------------------------------------------------------------------------
// 4. Delete Any Item
// -------------------------------------------------------------------------
exports.deleteAnyItem = async (data, context) => {
  try {
    await verifyAdmin(data, context);
    const { collection, id } = unwrapData(data);
    const db = admin.firestore();
    await db.collection(collection).doc(id).delete();
    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
};

// -------------------------------------------------------------------------
// 5. Make Me Admin
// -------------------------------------------------------------------------
exports.makeMeAdmin = async (data, context) => {
  try {
    const auth = context?.auth || data?.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Login first");
    }

    const input = unwrapData(data);
    if (input.secretKey !== DEPLOYMENT_SECRET) {
      console.warn(`Failed Admin Claim by ${auth.uid}`);
      throw new HttpsError("permission-denied", "INCORRECT SECRET KEY. Access Denied.");
    }

    const uid = auth.uid;
    const db = admin.firestore();

    await db.collection("users").doc(uid).set({ role: "admin" }, { merge: true });
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    return { success: true, message: "Admin privileges granted. Please Sign Out and Sign In again." };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
};