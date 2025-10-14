/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Require firebase-functions and prefer the v1-compatible API when available.
// Some versions of the SDK expose different entry points; guard against
// undefined members.
let functions;
try {
  functions = require("firebase-functions");
} catch (e) {
  // fallback to v1 path if top-level require fails
  try {
    functions = require("firebase-functions/v1");
  } catch (err) {
    throw e;
  }
}

// setGlobalOptions is only available on some versions; call it if present
if (functions && typeof functions.setGlobalOptions === "function") {
  try {
    functions.setGlobalOptions({maxInstances: 10});
  } catch (e) {/* ignore */}
}

// For cost control, you can set the maximum number of containers that can
// be running at the same time. This helps mitigate unexpected traffic
// spikes by downgrading performance instead of scaling infinitely. This is
// a per-function limit. You can override it with `maxInstances` per
// function.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count. We already attempted to
// call functions.setGlobalOptions above if available.

// Create and deploy your first functions
// See: https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
let authTriggers = null;
if (functions && functions.auth) {
  authTriggers = functions.auth;
} else {
  try {
    // Some versions expose v1 APIs under a subpath
    const f1 = require("firebase-functions/v1");
    if (f1 && f1.auth) {
      authTriggers = f1.auth;
    }
  } catch (e) {
    // ignore
  }
}

const {createUserProfile, contactSellerHandler} = require("./handlers/marketplace");

// Register auth trigger if available (supports multiple firebase-functions versions)
try {
  if (authTriggers && typeof authTriggers.user === "function") {
    const trigger = authTriggers.user();
    if (trigger && typeof trigger.onCreate === "function") {
      exports.onUserCreate = trigger.onCreate((user) => {
        const email = user && user.email;
        const uid = user && user.uid;
        console.log("New user created:", email || "(no-email)", "uid:", uid);
        return createUserProfile(user);
      });
    }
  } else {
    console.warn(
        "firebase-functions auth triggers are not available in this",
      "environment; onUserCreate will not be registered.",
    );
  }
} catch (e) {
  console.warn("Failed to register auth trigger:", e && e.message);
}

// Register callable HTTPS function robustly depending on functions API surface
try {
  if (
    functions &&
    functions.https &&
    typeof functions.https.onCall === "function"
  ) {
    exports.contactSeller = functions.https.onCall(
      async (data, context) => contactSellerHandler(data, context),
    );
  } else if (
    functions &&
    typeof functions.https === "function"
  ) {
    // Older versions may export https directly
    exports.contactSeller = functions.https.onCall(
      async (data, context) => contactSellerHandler(data, context),
    );
  } else if (
    functions &&
    functions.httpsCallable
  ) {
    // v2 style (unlikely here) - fallback to an express-style wrapper
    exports.contactSeller = functions.https.onCall(
      async (data, context) => contactSellerHandler(data, context),
    );
  } else {
    console.warn(
      "functions.https.onCall is not available -",
      "contactSeller not registered.",
    );
  }
} catch (e) {
  console.warn("Failed to register callable function contactSeller:", e && e.message);
}
