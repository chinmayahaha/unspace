const admin = require("firebase-admin");

// --- CONFIGURATION ---
// CHANGE THIS to a long, random string that ONLY YOU know.
const DEPLOYMENT_SECRET = "UNi]BoVI&%qw)rJ!Ma+eW)4"; 

/**
 * HELPER: Enterprise Grade Admin Check
 * 1. Checks Auth
 * 2. Checks Custom Claims (Fastest, $0 cost)
 * 3. Checks Database Role (Fallback, 1 Read cost)
 */
async function verifyAdmin(context) {
    // 1. Fail if not logged in
    if (!context.auth) throw new Error("Authentication required");

    // 2. CHECK CUSTOM CLAIMS (Best Practice)
    // This allows admin access without reading the database every time.
    if (context.auth.token.admin === true) {
        return true;
    }

    // 3. FALLBACK: Check Database (Only if claim is missing)
    const uid = context.auth.uid;
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      console.warn(`Unauthorized Admin Access Attempt by: ${uid}`);
      throw new Error("ACCESS DENIED: Admins only.");
    }
    
    // If DB says admin but token doesn't, fix the token for next time
    if (userDoc.data().role === 'admin') {
        await admin.auth().setCustomUserClaims(uid, { admin: true });
    }
    
    return true;
}

// 1. Get Stats (Dashboard Metrics)
exports.getAdminStats = async (data, context) => {
    await verifyAdmin(context);
    const db = admin.firestore();
    
    // Using snapshot.size is fine for < 10k users. 
    // For > 10k, switch to count() aggregation queries.
    const usersSnap = await db.collection("users").get();
    const listingsSnap = await db.collection("listings").get();
    const booksSnap = await db.collection("books").get();
    const adsSnap = await db.collection("serviceRequests").get();
    const reportsSnap = await db.collection("reports").get();

    return {
        totalUsers: usersSnap.size,
        totalListings: listingsSnap.size,
        totalBooks: booksSnap.size,
        totalAds: adsSnap.size,
        pendingReports: reportsSnap.size
    };
};

// 2. User Management (The Ban Hammer)
exports.getAllUsers = async (data, context) => {
    await verifyAdmin(context);
    const db = admin.firestore();
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").limit(50).get();
    return { users: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
};

exports.banUser = async (data, context) => {
    await verifyAdmin(context);
    const { targetUserId, ban } = data; 
    const db = admin.firestore();
    
    // Update DB status
    await db.collection("users").doc(targetUserId).update({
        isBanned: ban,
        bannedAt: ban ? new Date() : null
    });
    
    // ENTERPRISE ADDITION: Immediate Session Kill
    // If we ban them, we must invalidate their login token immediately.
    if (ban) {
        try {
            await admin.auth().revokeRefreshTokens(targetUserId);
        } catch (e) {
            console.error("Failed to revoke tokens", e);
        }
    }

    return { success: true };
};

// 3. Universal Delete
exports.deleteAnyItem = async (data, context) => {
    await verifyAdmin(context);
    const { collection, id } = data;
    const db = admin.firestore();
    await db.collection(collection).doc(id).delete();
    return { success: true };
};

/**
 * 4. SECURE "Make Me Admin"
 * This allows you to promote yourself, but ONLY if you have the secret key.
 */
exports.makeMeAdmin = async (data, context) => {
    // 1. Check if user is logged in
    if (!context.auth) throw new Error("Login first");
    
    // 2. SECURITY CHECK: Check the secret password
    if (data.secretKey !== DEPLOYMENT_SECRET) {
        console.warn(`Failed Admin Claim by ${context.auth.uid}`);
        throw new Error("Invalid Secret Key. Incident Logged.");
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    // 3. Update Database Role
    await db.collection("users").doc(uid).set({ role: 'admin' }, { merge: true });
    
    // 4. Set Custom Claim (The "VIP Pass" attached to your user token)
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    return { success: true, message: "Admin privileges granted. Please Sign Out and Sign In again to refresh permissions." };
};