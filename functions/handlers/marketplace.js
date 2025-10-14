const admin = require("firebase-admin");

// Ensure admin is initialized by the caller (index.js)

/**
 * Create or update a Firestore profile document for a newly created user.
 * @param {Object} user The Firebase Auth user record.
 * @return {Promise<Object|null>} The profile payload or null on invalid input.
 */
async function createUserProfile(user) {
  if (!user || !user.uid) {
    console.warn("createUserProfile called with invalid user:", user);
    return null;
  }

  const db = admin.firestore();
  const ref = db.collection("users").doc(user.uid);
  const payload = {
    email: user.email || null,
    name: user.displayName || (user.email ? user.email.split("@")[0] : null),
    photoURL: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await ref.set(payload, {merge: true});
  return payload;
}


/**
 * contactSellerHandler accepts either v1 signature (data, context)
 * or v2 CallableRequest object (req) and normalizes to (data, context).
 * @param {Object} arg1 Data or CallableRequest
 * @param {Object} [arg2] Context when using v1 signature
 */
async function contactSellerHandler(arg1, arg2) {
  let data;
  let context;

  if (arg2 === undefined && arg1 && typeof arg1 === "object" &&
    ("data" in arg1 || "auth" in arg1)) {
    // v2 CallableRequest style
    data = arg1.data || {};
    context = {auth: arg1.auth || null};
  } else {
    data = arg1 || {};
    context = arg2 || {};
  }

  const listingId = data.listingId;
  const message = data.message || "";
  const buyerUid = (context && context.auth &&
    (context.auth.uid || (context.auth.token &&
    context.auth.token.uid))) || null;

  // Basic validation
  if (!buyerUid) {
    throw new Error("unauthenticated: buyer UID missing");
  }

  // Here you'd create a chat, notification, or send email.
  // For now write a lightweight record.
  const db = admin.firestore();
  const docRef = db.collection("listing_interests").doc();
  await docRef.set({
    listingId: listingId || null,
    message,
    buyerUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("User", buyerUid, "expressed interest in", listingId);
  return {status: "success", listingId};
}

module.exports = {
  createUserProfile,
  contactSellerHandler,
};

