/* functions/handlers/bookExchange.js */
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");
const { logUserAction } = require("../services/analytics");

// -------------------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------------------
function unwrapData(request) {
  // FIX: In v2, payload is at request.data (not the first argument)
  const data = request.data || request;
  if (!data) return {};
  if (typeof data === "object" && data.data) return data.data;
  return data;
}

function getUserId(request) {
  // FIX: In v2, auth is at request.auth (not context.auth)
  if (request.auth?.uid) return request.auth.uid;
  const isEmulator =
    process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (isEmulator) return "emulator-test-user-123";
  return null;
}

// -------------------------------------------------------------------------
// 1. Add Book For Exchange
// -------------------------------------------------------------------------
async function addBookForExchange(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { title, author, isbn, condition, description, imageUrl, course, semester, price, edition } = input;

    if (!title || !author) {
      throw new HttpsError("invalid-argument", "Title and author are required");
    }

    const db = admin.firestore();
    const bookRef = db.collection("books").doc();

    const bookData = {
      id: bookRef.id,
      ownerId: userId,
      title,
      author,
      isbn: isbn || "",
      edition: edition || "",
      condition: condition || "good",
      description: description || "",
      imageUrl: imageUrl || "",
      course: course || "",
      semester: semester || "",
      price: price ? parseFloat(price) : 0,
      status: "pending", // pending | available | exchanged | reserved
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await bookRef.set(bookData);

    try {
      await logUserAction(userId, "book_added", { bookId: bookRef.id, title, course });
    } catch (e) {
      console.warn("Analytics log failed", e);
    }

    return { bookId: bookRef.id, success: true };
  } catch (error) {
    console.error("Add Book Error:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 2. Find Matching Books
// -------------------------------------------------------------------------
async function findMatchingBooks(request) {
  try {
    const currentUserId = getUserId(request);
    if (!currentUserId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { userId: targetUserId, bookId } = input;

    const db = admin.firestore();

    const userBooksSnapshot = await db
      .collection("books")
      .where("ownerId", "==", currentUserId)
      .where("status", "==", "available")
      .get();

    const userBooks = userBooksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (userBooks.length === 0) {
      return { matches: [], message: "No books available for exchange" };
    }

    if (bookId) {
      const targetBookDoc = await db.collection("books").doc(bookId).get();
      if (!targetBookDoc.exists) throw new HttpsError("not-found", "Book not found");

      const targetBook = targetBookDoc.data();
      if (targetBook.ownerId === currentUserId) {
        throw new HttpsError("invalid-argument", "Cannot exchange with yourself");
      }

      const matchesSnapshot = await db
        .collection("books")
        .where("ownerId", "==", targetBook.ownerId)
        .where("status", "==", "available")
        .get();

      const matches = matchesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return { targetBook, userBooks, matches };
    }

    if (targetUserId) {
      const targetBooksSnapshot = await db
        .collection("books")
        .where("ownerId", "==", targetUserId)
        .where("status", "==", "available")
        .get();

      const targetBooks = targetBooksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return { userBooks, targetBooks };
    }

    return { matches: [] };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 3. Initiate Exchange Request
// -------------------------------------------------------------------------
async function initiateExchangeRequest(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { targetBookId, offeredBookId, message } = input;

    if (!targetBookId) {
      throw new HttpsError("invalid-argument", "Target book ID is required");
    }

    const db = admin.firestore();
    const targetBookDoc = await db.collection("books").doc(targetBookId).get();

    if (!targetBookDoc.exists) throw new HttpsError("not-found", "Target book not found");
    const targetBook = targetBookDoc.data();

    if (targetBook.ownerId === userId) {
      throw new HttpsError("invalid-argument", "Cannot request your own book");
    }

    const exchangeRef = db.collection("exchangeRequests").doc();
    await exchangeRef.set({
      id: exchangeRef.id,
      requesterId: userId,
      targetBookId,
      offeredBookId: offeredBookId || null,
      targetOwnerId: targetBook.ownerId,
      message: message || "I am interested in this book.",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

   // Create conversation
const conversationId = `book_${targetBookId}_${userId}_${targetBook.ownerId}`;
const conversationRef = db.collection("conversations").doc(conversationId);
const convSnap = await conversationRef.get();

if (!convSnap.exists) {
  await conversationRef.set({
    id: conversationId,
    itemType: "book",
    itemId: targetBookId,
    itemTitle: targetBook.title,
    itemImage: targetBook.imageUrl || null,
    participants: [userId, targetBook.ownerId],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessage: message || "I'm interested in your book!",
    lastMessageAt: new Date(),
    lastMessageSenderId: userId,
  });
}

await conversationRef.collection("messages").add({
  conversationId,
  senderId: userId,
  text: message || "I'm interested in your book!",
  type: "book_request",
  createdAt: new Date(),
  read: false,
});

// Keep notification for backward compat
await db.collection("notifications").add({
  toUserId: targetBook.ownerId,
  fromUserId: userId,
  type: "book_request",
  message: message || "I'm interested in your book!",
  item: targetBook.title,
  itemId: targetBookId,
  relatedId: exchangeRef.id,
  conversationId,
  createdAt: new Date(),
  read: false,
});

    return { exchangeId: exchangeRef.id, status: "pending", success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 4. Manage Exchange Status
// -------------------------------------------------------------------------
async function manageExchangeStatus(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { exchangeId, action } = input;

    if (!exchangeId || !action) {
      throw new HttpsError("invalid-argument", "Exchange ID and action are required");
    }

    const db = admin.firestore();
    const exchangeRef = db.collection("exchangeRequests").doc(exchangeId);
    const exchangeDoc = await exchangeRef.get();

    if (!exchangeDoc.exists) throw new HttpsError("not-found", "Exchange request not found");

    const exchange = exchangeDoc.data();

    if (exchange.targetOwnerId !== userId) {
      throw new HttpsError("permission-denied", "Not authorized to manage this exchange");
    }

    if (exchange.status !== "pending") {
      throw new HttpsError("failed-precondition", "Exchange request is no longer pending");
    }

    const updateData = {
      status: action === "accept" ? "accepted" : "declined",
      updatedAt: new Date(),
    };

    if (action === "accept") {
      updateData.acceptedAt = new Date();
      await Promise.all([
        db.collection("books").doc(exchange.targetBookId).update({ status: "exchanged", exchangedAt: new Date() }),
        db.collection("books").doc(exchange.offeredBookId).update({ status: "exchanged", exchangedAt: new Date() }),
      ]);
    } else {
      updateData.declinedAt = new Date();
    }

    await exchangeRef.update(updateData);

    try {
      await logUserAction(userId, `exchange_${action}ed`, {
        exchangeId,
        requesterId: exchange.requesterId,
      });
    } catch (e) {}

    return { success: true, status: updateData.status };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 5. Get User Exchange Requests
// -------------------------------------------------------------------------
async function getUserExchangeRequests(request) {
  try {
    const userId = getUserId(request);
    if (!userId) throw new HttpsError("unauthenticated", "Authentication required");

    const input = unwrapData(request);
    const { type = "all" } = input;

    const db = admin.firestore();
    let query;

    switch (type) {
      case "sent":
        query = db.collection("exchangeRequests").where("requesterId", "==", userId);
        break;
      case "received":
        query = db.collection("exchangeRequests").where("targetOwnerId", "==", userId);
        break;
      default:
        query = db.collection("exchangeRequests").where("requesterId", "==", userId);
        break;
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return { requests };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

// -------------------------------------------------------------------------
// 6. Get All Books (public)
// -------------------------------------------------------------------------
async function getAllBooks(request) {
  try {
    const input = unwrapData(request);
    const { limit = 20, lastDocId, searchTerm } = input;

    const db = admin.firestore();
    let query = db.collection("books").where("status", "==", "available").orderBy("createdAt", "desc");

    if (lastDocId) {
      const lastDoc = await db.collection("books").doc(lastDocId).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    query = query.limit(limit);
    const snapshot = await query.get();

    let books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      books = books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          (book.course && book.course.toLowerCase().includes(searchLower))
      );
    }

    return {
      books,
      hasMore: snapshot.docs.length === limit,
      lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
}

module.exports = {
  addBookForExchange,
  findMatchingBooks,
  initiateExchangeRequest,
  manageExchangeStatus,
  getUserExchangeRequests,
  getAllBooks,
};