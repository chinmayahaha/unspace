const admin = require("firebase-admin");
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for functions
functions.setGlobalOptions({maxInstances: 10});

// Import handlers
const adminHandlers = require("./handlers/admin");
const marketplaceHandlers = require("./handlers/marketplace");
const bookExchangeHandlers = require("./handlers/bookExchange");
const communityHandlers = require("./handlers/community");
const businessXHandlers = require("./handlers/businessX");
const adsXHandlers = require("./handlers/adsX");
const {createUserProfile} = require("./handlers/marketplace");
const {handleStripeWebhook} = require("./services/payments");

// Create Express app for HTTP endpoints
const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// Stripe webhook endpoint
app.post("/stripe-webhook", async (req, res) => {
  try {
    await handleStripeWebhook(req.body);
    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).send("Webhook failed");
  }
});

// Export HTTP app
exports.api = functions.https.onRequest(app);

// Auth trigger for new user creation (guarded)
if (functions && functions.auth && typeof functions.auth.user === 'function') {
  exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    console.log("New user created:", user.email || "(no-email)", "uid:", user.uid);
    return createUserProfile(user);
  });
} else {
  console.warn('functions.auth is not available during analysis — skipping onUserCreate export.');
}

// Firestore trigger for AI tasks (guarded)
if (functions && functions.firestore && typeof functions.firestore.document === 'function') {
  exports.processAITask = functions.firestore
      .document("aiTasks/{taskId}")
      .onCreate(async (snap, context) => {
        const task = snap.data();
        console.log("AI task created:", task.type, task.status);

        // This will trigger the Python function
        return null;
      });
} else {
  console.warn('functions.firestore is not available during analysis — skipping processAITask export.');
}

// Marketplace Functions
exports.createListing = functions.https.onCall(marketplaceHandlers.createListing);
exports.getListing = functions.https.onCall(marketplaceHandlers.getListing);
exports.getAllListings = functions.https.onCall(marketplaceHandlers.getAllListings);
exports.getUserListings = functions.https.onCall(marketplaceHandlers.getUserListings); // <--- ADDED THIS LINE
exports.updateListing = functions.https.onCall(marketplaceHandlers.updateListing);
exports.deleteListing = functions.https.onCall(marketplaceHandlers.deleteListing);
exports.contactSeller = functions.https.onCall(marketplaceHandlers.contactSeller);
exports.featureListing = functions.https.onCall(marketplaceHandlers.featureListing);

// 5. ADMIN (KRYPTONITE)
// =========================================================
exports.getAdminStats = functions.https.onCall(adminHandlers.getAdminStats);
exports.getAllUsers = functions.https.onCall(adminHandlers.getAllUsers);
exports.banUser = functions.https.onCall(adminHandlers.banUser);
exports.deleteAnyItem = functions.https.onCall(adminHandlers.deleteAnyItem);
exports.makeMeAdmin = functions.https.onCall(adminHandlers.makeMeAdmin);

// Book Exchange Functions
exports.addBookForExchange = functions.https.onCall(bookExchangeHandlers.addBookForExchange);
exports.findMatchingBooks = functions.https.onCall(bookExchangeHandlers.findMatchingBooks);
exports.initiateExchangeRequest = functions.https.onCall(bookExchangeHandlers.initiateExchangeRequest);
exports.manageExchangeStatus = functions.https.onCall(bookExchangeHandlers.manageExchangeStatus);
exports.getUserExchangeRequests = functions.https.onCall(bookExchangeHandlers.getUserExchangeRequests);
exports.getAllBooks = functions.https.onCall(bookExchangeHandlers.getAllBooks);

// Community Functions
//exports.createPost = functions.https.onCall(communityHandlers.createPost);
//exports.getPosts = functions.https.onCall(communityHandlers.getPosts);
//exports.getPost = functions.https.onCall(communityHandlers.getPost);
//exports.deletePost = functions.https.onCall(communityHandlers.deletePost);
//exports.addComment = functions.https.onCall(communityHandlers.addComment);
//exports.getComments = functions.https.onCall(communityHandlers.getComments);
//exports.togglePostLike = functions.https.onCall(communityHandlers.togglePostLike);
//exports.postOfficialAnnouncement = functions.https.onCall(communityHandlers.postOfficialAnnouncement);

// BusinessX Functions
exports.registerBusiness = functions.https.onCall(businessXHandlers.registerBusiness);
exports.getBusinessProfile = functions.https.onCall(businessXHandlers.getBusinessProfile);
exports.getAllBusinesses = functions.https.onCall(businessXHandlers.getAllBusinesses);
exports.updateBusinessProfile = functions.https.onCall(businessXHandlers.updateBusinessProfile);
exports.addReview = functions.https.onCall(businessXHandlers.addReview);
exports.getReviews = functions.https.onCall(businessXHandlers.getReviews);
exports.verifyBusiness = functions.https.onCall(businessXHandlers.verifyBusiness);

// AdsX Functions
exports.submitServiceRequest = functions.https.onCall(adsXHandlers.submitServiceRequest);
exports.getRequests = functions.https.onCall(adsXHandlers.getRequests);
exports.updateRequestStatus = functions.https.onCall(adsXHandlers.updateRequestStatus);
exports.assignRequest = functions.https.onCall(adsXHandlers.assignRequest);
exports.promoteRequest = functions.https.onCall(adsXHandlers.promoteRequest);
exports.getRequestDetails = functions.https.onCall(adsXHandlers.getRequestDetails);
exports.applyToRequest = functions.https.onCall(adsXHandlers.applyToRequest);