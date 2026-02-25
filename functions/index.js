/* functions/index.js */
/* ============================================================
   FIXED FOR: firebase-functions v7 + Node 22
   - Removed all runWith() calls (removed in v4+)
   - Using new modular onCall / onRequest / onDocumentCreated
   - Memory & timeout set via options object in each function
   ============================================================ */

   const admin = require("firebase-admin");
   const { onRequest, onCall } = require("firebase-functions/v2/https");
   const express = require("express");
   const cors    = require("cors");
   
   // Initialize Firebase Admin (only once)
   admin.initializeApp();
   
   // --- Shared runtime options (replaces runWith) ---
   const fnOpts = {
     timeoutSeconds: 300,
     memory: "1GiB",       // v2 uses "GiB" not "GB"
     region: "us-central1",
     invoker: ["public"],    // FIX: allow Firebase client SDK to call these functions
   };
   
   // ----------------------------------------------------------------
   // Import handlers
   // ----------------------------------------------------------------
   const adminHandlers       = require("./handlers/admin");
   const marketplaceHandlers = require("./handlers/marketplace");
   const bookExchangeHandlers= require("./handlers/bookExchange");
   const communityHandlers   = require("./handlers/community");
   const businessXHandlers   = require("./handlers/businessX");
   const adsXHandlers        = require("./handlers/adsX");
   const { handleStripeWebhook } = require("./services/payments");
   const lostAndFoundHandlers = require("./handlers/lostAndFound");
   const messagingHandlers    = require("./handlers/messaging");
   
   // ----------------------------------------------------------------
   // HTTP / Express app  (Stripe webhook)
   // ----------------------------------------------------------------
   const app = express();
   app.use(cors({ origin: true }));
   app.use(express.json());
   
   app.post("/stripe-webhook", async (req, res) => {
     try {
       await handleStripeWebhook(req.body);
       res.status(200).send("Webhook processed");
     } catch (error) {
       console.error("Webhook error:", error);
       res.status(400).send("Webhook failed");
     }
   });
   
   // v2 onRequest replaces functions.https.onRequest
   exports.api = onRequest(fnOpts, app);
   
   // ----------------------------------------------------------------
   // MARKETPLACE FUNCTIONS
   // ----------------------------------------------------------------
   exports.createListing    = onCall(fnOpts, marketplaceHandlers.createListing);
   exports.getListing       = onCall(fnOpts, marketplaceHandlers.getListing);
   exports.getAllListings    = onCall(fnOpts, marketplaceHandlers.getAllListings);
   exports.getUserListings  = onCall(fnOpts, marketplaceHandlers.getUserListings);
   exports.updateListing    = onCall(fnOpts, marketplaceHandlers.updateListing);
   exports.deleteListing    = onCall(fnOpts, marketplaceHandlers.deleteListing);
   exports.contactSeller    = onCall(fnOpts, marketplaceHandlers.contactSeller);
   exports.featureListing   = onCall(fnOpts, marketplaceHandlers.featureListing);
   
   // ----------------------------------------------------------------
   // ADMIN FUNCTIONS
   // ----------------------------------------------------------------
   exports.getAdminStats = onCall(fnOpts, adminHandlers.getAdminStats);
   exports.getAllUsers    = onCall(fnOpts, adminHandlers.getAllUsers);
   exports.banUser       = onCall(fnOpts, adminHandlers.banUser);
   exports.deleteAnyItem = onCall(fnOpts, adminHandlers.deleteAnyItem);
   exports.makeMeAdmin   = onCall(fnOpts, adminHandlers.makeMeAdmin);
   
   // ----------------------------------------------------------------
   // BOOK EXCHANGE FUNCTIONS
   // ----------------------------------------------------------------
   exports.addBookForExchange     = onCall(fnOpts, bookExchangeHandlers.addBookForExchange);
   exports.findMatchingBooks      = onCall(fnOpts, bookExchangeHandlers.findMatchingBooks);
   exports.initiateExchangeRequest= onCall(fnOpts, bookExchangeHandlers.initiateExchangeRequest);
   exports.manageExchangeStatus   = onCall(fnOpts, bookExchangeHandlers.manageExchangeStatus);
   exports.getUserExchangeRequests= onCall(fnOpts, bookExchangeHandlers.getUserExchangeRequests);
   exports.getAllBooks             = onCall(fnOpts, bookExchangeHandlers.getAllBooks);
   
   // ----------------------------------------------------------------
   // BUSINESSX FUNCTIONS
   // ----------------------------------------------------------------
   exports.registerBusiness      = onCall(fnOpts, businessXHandlers.registerBusiness);
   exports.getBusinessProfile    = onCall(fnOpts, businessXHandlers.getBusinessProfile);
   exports.getAllBusinesses       = onCall(fnOpts, businessXHandlers.getAllBusinesses);
   exports.updateBusinessProfile = onCall(fnOpts, businessXHandlers.updateBusinessProfile);
   exports.addReview             = onCall(fnOpts, businessXHandlers.addReview);
   exports.getReviews            = onCall(fnOpts, businessXHandlers.getReviews);
   exports.verifyBusiness        = onCall(fnOpts, businessXHandlers.verifyBusiness);
   
   // ----------------------------------------------------------------
   // ADSX FUNCTIONS
   // ----------------------------------------------------------------
   exports.submitServiceRequest = onCall(fnOpts, adsXHandlers.submitServiceRequest);
   exports.getRequests          = onCall(fnOpts, adsXHandlers.getRequests);
   exports.updateRequestStatus  = onCall(fnOpts, adsXHandlers.updateRequestStatus);
   exports.assignRequest        = onCall(fnOpts, adsXHandlers.assignRequest);
   exports.promoteRequest       = onCall(fnOpts, adsXHandlers.promoteRequest);
   exports.getRequestDetails    = onCall(fnOpts, adsXHandlers.getRequestDetails);
   exports.applyToRequest       = onCall(fnOpts, adsXHandlers.applyToRequest);

   // -------------------------------------------------------------------------
// LOST & FOUND
// -------------------------------------------------------------------------
exports.postLostOrFoundItem = onCall(fnOpts, lostAndFoundHandlers.postItem);
exports.getLostAndFoundItems = onCall(fnOpts, lostAndFoundHandlers.getItems);
exports.claimLostOrFoundItem = onCall(fnOpts, lostAndFoundHandlers.claimItem);
exports.markLostOrFoundResolved = onCall(fnOpts, lostAndFoundHandlers.markResolved);
exports.getMyLostAndFoundItems = onCall(fnOpts, lostAndFoundHandlers.getMyItems);

// -------------------------------------------------------------------------
// MESSAGING
// -------------------------------------------------------------------------
exports.sendMessage = onCall(fnOpts, messagingHandlers.sendMessage);
exports.getConversations = onCall(fnOpts, messagingHandlers.getConversations);
exports.getMessages = onCall(fnOpts, messagingHandlers.getMessages);
exports.markMessagesAsRead = onCall(fnOpts, messagingHandlers.markAsRead);
exports.createConversation = onCall(fnOpts, messagingHandlers.createConversation);