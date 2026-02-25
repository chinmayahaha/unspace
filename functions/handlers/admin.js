/* functions/handlers/admin.js */
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

const DEPLOYMENT_SECRET = "UNi]BoVI&%qw)rJ!Ma+eW)4";

// -------------------------------------------------------------------------
// HELPER: Verify admin from v2 request object
// -------------------------------------------------------------------------
async function verifyAdmin(request) {
  // FIX: v2 auth is at request.auth, not context.auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // Check custom claim first (fast path)
  if (request.auth.token.admin === true) return true;

  // Fallback: check Firestore
  const uid = request.auth.uid;
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
exports.getAdminStats = async (request) => {
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
exports.getAllUsers = async (request) => {
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
exports.banUser = async (request) => {
  try {
    await verifyAdmin(request);
    // FIX: data is at request.data in v2
    const { targetUserId, ban } = request.data;
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
exports.deleteAnyItem = async (request) => {
  try {
    await verifyAdmin(request);
    const { collection, id } = request.data;
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
exports.makeMeAdmin = async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login first");
    }

    if (request.data.secretKey !== DEPLOYMENT_SECRET) {
      console.warn(`Failed Admin Claim by ${request.auth.uid}`);
      throw new HttpsError("permission-denied", "INCORRECT SECRET KEY. Access Denied.");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    await db.collection("users").doc(uid).set({ role: "admin" }, { merge: true });
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    return { success: true, message: "Admin privileges granted. Please Sign Out and Sign In again." };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
};