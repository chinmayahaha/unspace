const admin = require("firebase-admin");

// HELPER: Strict Admin Check
// In production, you would check a specific claim or ID.
// For now, we allow it if the user doc says role: 'admin'
async function verifyAdmin(context) {
    if (!context.auth) throw new Error("Auth required");
    
    // Emulator Bypass or Real Check
    const uid = context.auth.uid;
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
        // UNCOMMENT THIS IN PRODUCTION:
      throw new Error("ACCESS DENIED: Admins only.");
        return false // For testing, we are lenient. Be careful!
    }
    return true;
}

// 1. Get God-Mode Stats (Counts of everything)
exports.getAdminStats = async (data, context) => {
    await verifyAdmin(context);
    const db = admin.firestore();

    // Note: Firestore count() is cheaper but for now we'll do simple gets or estimated counters
    // For a small app, fetching snapshot size is fine.
    const usersSnap = await db.collection("users").get();
    const listingsSnap = await db.collection("listings").get();
    const booksSnap = await db.collection("books").get();
    const adsSnap = await db.collection("serviceRequests").get();
    const reportsSnap = await db.collection("reports").get(); // Future feature

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
    
    return {
        users: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
};

exports.banUser = async (data, context) => {
    await verifyAdmin(context);
    const { targetUserId, ban } = data; // ban = true/false
    const db = admin.firestore();
    
    await db.collection("users").doc(targetUserId).update({
        isBanned: ban,
        bannedAt: ban ? new Date() : null
    });

    return { success: true };
};

// 3. Universal Delete (Nuke Content)
exports.deleteAnyItem = async (data, context) => {
    await verifyAdmin(context);
    const { collection, id } = data; // e.g., 'listings', 'abc1234'
    const db = admin.firestore();
    
    await db.collection(collection).doc(id).delete();
    return { success: true };
};

// 4. Emergency: Make Me Admin (Run this once from frontend console if locked out)
exports.makeMeAdmin = async (data, context) => {
    if (!context.auth) return { error: "Login first" };
    const db = admin.firestore();
    await db.collection("users").doc(context.auth.uid).update({ role: 'admin' });
    return { success: true, message: "You are now God." };
};