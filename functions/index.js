/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// functions/index.js

// Import the necessary modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Admin SDK, which gives your functions special access
admin.initializeApp();

/**
 * Triggered when a new user is created in Firebase Authentication.
 * This function creates a corresponding user document in Firestore.
 */
exports.onUserCreate = functions.auth.user().onCreate((user) => {
  console.log(`A new user signed up: ${user.email} (UID: ${user.uid})`);

  // Get a reference to the Firestore database
  const userDocRef = admin.firestore().collection("users").doc(user.uid);

  // Set the initial user profile data
  return userDocRef.set({
    email: user.email,
    name: user.displayName || user.email.split('@')[0], // Use display name if available
    photoURL: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

// functions/index.js (add this below the onUserCreate function)

/**
 * A callable function that lets a logged-in user send a message
 * or express interest in a marketplace listing.
 */
exports.contactSeller = functions.https.onCall(async (data, context) => {
  // 1. Check if the user calling this function is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to contact a seller."
    );
  }

  // 2. Get the data sent from the React app
  const { listingId, message } = data;
  const buyerUid = context.auth.uid;

  // 3. (In a real app) Here you would:
  //    - Get the seller's UID from the listing document.
  //    - Create a new 'chats' document between the buyer and seller.
  //    - Send a push notification or email to the seller.

  // For now, we'll just log that it worked.
  console.log(
    `User ${buyerUid} is interested in listing ${listingId} with message: "${message}"`
  );

  // 4. Return a success message to the React app
  return { status: "success", message: "Your interest has been noted!" };
});