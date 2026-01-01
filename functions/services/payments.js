const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe checkout session
 * @param {Object} data - Payment data
 * @param {string} data.userId - User ID
 * @param {string} data.type - Payment type (listing_featured, ads_promotion, etc.)
 * @param {string} data.itemId - ID of the item being paid for
 * @param {number} data.amount - Amount in cents
 * @param {string} data.description - Payment description
 * @param {string} data.successUrl - Success redirect URL
 * @param {string} data.cancelUrl - Cancel redirect URL
 */
async function createCheckoutSession(data) {
  const {userId, type, itemId, amount, description, successUrl, cancelUrl} = data;

  if (!userId || !type || !itemId || !amount || !description) {
    throw new Error("Missing required payment parameters");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: description,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: successUrl || `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        userId,
        type,
        itemId,
      },
    });

    // Log payment initiation
    const db = admin.firestore();
    await db.collection("orders").doc(session.id).set({
      userId,
      type,
      itemId,
      amount,
      description,
      status: "pending",
      stripeSessionId: session.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    throw new Error("Payment session creation failed");
  }
}

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe webhook event
 */
async function handleStripeWebhook(event) {
  // db not needed here; individual handlers manage Firestore

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "payment_intent.succeeded":
      await handlePaymentSucceeded(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Handle successful checkout completion
 * @param {Object} session - Stripe session object
 */
async function handleCheckoutCompleted(session) {
  const db = admin.firestore();
  const {type, itemId} = session.metadata;

  // Update order status
  await db.collection("orders").doc(session.id).update({
    status: "completed",
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    stripePaymentIntentId: session.payment_intent,
  });

  // Apply the paid service based on type
  switch (type) {
    case "listing_featured":
      await db.collection("listings").doc(itemId).update({
        featured: true,
        featuredUntil: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;
    case "ads_promotion":
      await db.collection("serviceRequests").doc(itemId).update({
        status: "paid",
        promoted: true,
      });
      break;
    default:
      console.log(`Unknown payment type: ${type}`);
  }

  console.log(`Payment completed for ${type}: ${itemId}`);
}

/**
 * Handle successful payment
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  // Additional logic can be added here if needed
}

/**
 * Handle failed payment
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentFailed(paymentIntent) {
  const db = admin.firestore();

  // Update order status to failed
  const ordersQuery = await db.collection("orders")
      .where("stripePaymentIntentId", "==", paymentIntent.id)
      .get();

  for (const doc of ordersQuery.docs) {
    await doc.ref.update({
      status: "failed",
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
    });
  }

  console.log(`Payment failed: ${paymentIntent.id}`);
}

/**
 * Get user's payment history
 * @param {string} userId - User ID
 */
async function getUserPaymentHistory(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const db = admin.firestore();
  const snapshot = await db.collection("orders")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

module.exports = {
  createCheckoutSession,
  handleStripeWebhook,
  getUserPaymentHistory,
};
