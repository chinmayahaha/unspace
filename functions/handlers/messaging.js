/* functions/handlers/messaging.js */
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

function unwrapData(request) {
  const data = request.data || request;
  if (!data) return {};
  if (typeof data === "object" && data.data) return data.data;
  return data;
}

function getUserId(request) {
  if (request.auth?.uid) return request.auth.uid;
  const isEmulator =
    process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (isEmulator) return "emulator-test-user-123";
  return null;
}

// -------------------------------------------------------------------------
// 1. Send Message in Conversation
// -------------------------------------------------------------------------
async function sendMessage(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { conversationId, text } = input;

    if (!conversationId || !text) {
      throw new HttpsError("invalid-argument", "Conversation ID and text are required");
    }

    const db = admin.firestore();
    const conversationRef = db.collection("conversations").doc(conversationId);
    const convSnap = await conversationRef.get();

    if (!convSnap.exists) throw new HttpsError("not-found", "Conversation not found");

    const conversation = convSnap.data();
    if (!conversation.participants.includes(userId)) {
      throw new HttpsError("permission-denied", "You are not part of this conversation");
    }

    await conversationRef.collection("messages").add({
      conversationId,
      senderId: userId,
      text,
      type: "text",
      createdAt: new Date(),
      read: false,
    });

    // FIX: persist lastMessageSenderId so Layout's unread badge logic works
    await conversationRef.update({
      lastMessage: text,
      lastMessageAt: new Date(),
      lastMessageSenderId: userId,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 2. Get User's Conversations
// -------------------------------------------------------------------------
async function getConversations(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const db = admin.firestore();
    const snapshot = await db
      .collection("conversations")
      .where("participants", "array-contains", userId)
      .orderBy("lastMessageAt", "desc")
      .limit(50)
      .get();

    const conversations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { conversations };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 3. Get Messages in Conversation
// -------------------------------------------------------------------------
async function getMessages(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { conversationId } = input;
    if (!conversationId) throw new HttpsError("invalid-argument", "Conversation ID required");

    const db = admin.firestore();
    const conversationRef = db.collection("conversations").doc(conversationId);
    const convSnap = await conversationRef.get();

    if (!convSnap.exists) throw new HttpsError("not-found", "Conversation not found");

    const conversation = convSnap.data();
    if (!conversation.participants.includes(userId)) {
      throw new HttpsError("permission-denied", "You are not part of this conversation");
    }

    const messagesSnapshot = await conversationRef
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    const messages = messagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { messages };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 4. Mark Messages as Read
// -------------------------------------------------------------------------
async function markAsRead(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { conversationId } = input;
    if (!conversationId) throw new HttpsError("invalid-argument", "Conversation ID required");

    const db = admin.firestore();
    const conversationRef = db.collection("conversations").doc(conversationId);
    const convSnap = await conversationRef.get();

    if (!convSnap.exists) throw new HttpsError("not-found", "Conversation not found");

    const messagesSnapshot = await conversationRef
      .collection("messages")
      .where("read", "==", false)
      .get();

    const batch = db.batch();
    messagesSnapshot.docs.forEach((doc) => {
      if (doc.data().senderId !== userId) {
        batch.update(doc.ref, { read: true });
      }
    });
    await batch.commit();

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 5. Create Conversation
// -------------------------------------------------------------------------
async function createConversation(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { itemType, itemId, itemTitle, recipientId, initialMessage } = input;

    if (!itemType || !itemId || !recipientId) {
      throw new HttpsError("invalid-argument", "Item type, ID, and recipient are required");
    }

    const db = admin.firestore();
    const conversationId = `${itemType}_${itemId}_${userId}_${recipientId}`;
    const conversationRef = db.collection("conversations").doc(conversationId);

    const convSnap = await conversationRef.get();
    if (convSnap.exists) {
      if (initialMessage) {
        await conversationRef.collection("messages").add({
          conversationId,
          senderId: userId,
          text: initialMessage,
          type: "text",
          createdAt: new Date(),
          read: false,
        });

        // FIX: persist lastMessageSenderId on existing conversation update too
        await conversationRef.update({
          lastMessage: initialMessage,
          lastMessageAt: new Date(),
          lastMessageSenderId: userId,
          updatedAt: new Date(),
        });
      }

      return { conversationId, exists: true };
    }

    // Create new conversation
    await conversationRef.set({
      id: conversationId,
      itemType,
      itemId,
      itemTitle: itemTitle || "Item",
      participants: [userId, recipientId],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: initialMessage || "",
      lastMessageAt: new Date(),
      lastMessageSenderId: userId, // FIX: include on creation
    });

    if (initialMessage) {
      await conversationRef.collection("messages").add({
        conversationId,
        senderId: userId,
        text: initialMessage,
        type: "text",
        createdAt: new Date(),
        read: false,
      });
    }

    return { conversationId, exists: false };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

module.exports = { sendMessage, getConversations, getMessages, markAsRead, createConversation };