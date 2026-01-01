const admin = require("firebase-admin");
const {logUserAction} = require("../services/analytics");

/**
 * Add a book for exchange
 */
async function addBookForExchange(data, context) {
  const {title, author, isbn, condition, description, imageUrl} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!title || !author) {
    throw new Error("Title and author are required");
  }

  const db = admin.firestore();
  const bookRef = db.collection("books").doc();

  const bookData = {
    id: bookRef.id,
    title,
    author,
    isbn: isbn || "",
    condition: condition || "good",
    description: description || "",
    imageUrl: imageUrl || "",
    ownerId: userId,
    status: "available",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await bookRef.set(bookData);

  // Log analytics
  await logUserAction(userId, "book_added", {
    bookId: bookRef.id,
    title,
    author,
  });

  return {bookId: bookRef.id, ...bookData};
}

/**
 * Find matching books for exchange
 */
async function findMatchingBooks(data, context) {
  const {userId: targetUserId, bookId} = data;
  const currentUserId = context.auth?.uid;

  if (!currentUserId) {
    throw new Error("Authentication required");
  }

  if (!targetUserId && !bookId) {
    throw new Error("Either userId or bookId is required");
  }

  const db = admin.firestore();

  // Get user's available books
  const userBooksSnapshot = await db.collection("books")
      .where("ownerId", "==", currentUserId)
      .where("status", "==", "available")
      .get();

  const userBooks = userBooksSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (userBooks.length === 0) {
    return {matches: [], message: "No books available for exchange"};
  }

  // If specific book requested, find matches for that book
  if (bookId) {
    const targetBookDoc = await db.collection("books").doc(bookId).get();
    if (!targetBookDoc.exists) {
      throw new Error("Book not found");
    }

    const targetBook = targetBookDoc.data();
    if (targetBook.ownerId === currentUserId) {
      throw new Error("Cannot exchange with yourself");
    }

    // Find books by the same author or similar genre
    const matchesSnapshot = await db.collection("books")
        .where("ownerId", "==", targetBook.ownerId)
        .where("status", "==", "available")
        .get();

    const matches = matchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      targetBook,
      userBooks,
      matches,
    };
  }

  // If userId provided, find all available books from that user
  if (targetUserId) {
    const targetBooksSnapshot = await db.collection("books")
        .where("ownerId", "==", targetUserId)
        .where("status", "==", "available")
        .get();

    const targetBooks = targetBooksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      userBooks,
      targetBooks,
    };
  }

  return {matches: []};
}

/**
 * Initiate exchange request
 */
async function initiateExchangeRequest(data, context) {
  const {targetBookId, offeredBookId, message} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!targetBookId || !offeredBookId) {
    throw new Error("Target book and offered book IDs are required");
  }

  const db = admin.firestore();

  // Verify both books exist and are available
  const [targetBookDoc, offeredBookDoc] = await Promise.all([
    db.collection("books").doc(targetBookId).get(),
    db.collection("books").doc(offeredBookId).get(),
  ]);

  if (!targetBookDoc.exists || !offeredBookDoc.exists) {
    throw new Error("One or both books not found");
  }

  const targetBook = targetBookDoc.data();
  const offeredBook = offeredBookDoc.data();

  if (targetBook.ownerId === userId) {
    throw new Error("Cannot exchange with yourself");
  }

  if (offeredBook.ownerId !== userId) {
    throw new Error("You don't own the offered book");
  }

  if (targetBook.status !== "available" || offeredBook.status !== "available") {
    throw new Error("One or both books are not available");
  }

  // Create exchange request
  const exchangeRef = db.collection("exchangeRequests").doc();
  await exchangeRef.set({
    id: exchangeRef.id,
    requesterId: userId,
    targetBookId,
    offeredBookId,
    targetOwnerId: targetBook.ownerId,
    message: message || "",
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Log analytics
  await logUserAction(userId, "exchange_requested", {
    exchangeId: exchangeRef.id,
    targetBookId,
    offeredBookId,
  });

  return {exchangeId: exchangeRef.id, status: "pending"};
}

/**
 * Manage exchange status (accept/decline)
 */
async function manageExchangeStatus(data, context) {
  const {exchangeId, action} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!exchangeId || !action) {
    throw new Error("Exchange ID and action are required");
  }

  if (!["accept", "decline"].includes(action)) {
    throw new Error("Action must be 'accept' or 'decline'");
  }

  const db = admin.firestore();
  const exchangeRef = db.collection("exchangeRequests").doc(exchangeId);
  const exchangeDoc = await exchangeRef.get();

  if (!exchangeDoc.exists) {
    throw new Error("Exchange request not found");
  }

  const exchange = exchangeDoc.data();

  // Only the target owner can accept/decline
  if (exchange.targetOwnerId !== userId) {
    throw new Error("Not authorized to manage this exchange");
  }

  if (exchange.status !== "pending") {
    throw new Error("Exchange request is no longer pending");
  }

  const updateData = {
    status: action === "accept" ? "accepted" : "declined",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (action === "accept") {
    updateData.acceptedAt = admin.firestore.FieldValue.serverTimestamp();

    // Mark both books as exchanged
    await Promise.all([
      db.collection("books").doc(exchange.targetBookId).update({
        status: "exchanged",
        exchangedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      db.collection("books").doc(exchange.offeredBookId).update({
        status: "exchanged",
        exchangedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ]);
  } else {
    updateData.declinedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await exchangeRef.update(updateData);

  // Log analytics
  await logUserAction(userId, `exchange_${action}ed`, {
    exchangeId,
    requesterId: exchange.requesterId,
  });

  return {success: true, status: updateData.status};
}

/**
 * Get user's exchange requests
 */
async function getUserExchangeRequests(data, context) {
  const {type = "all"} = data; // "sent", "received", "all"
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  const db = admin.firestore();
  let query;

  switch (type) {
    case "sent":
      query = db.collection("exchangeRequests")
          .where("requesterId", "==", userId);
      break;
    case "received":
      query = db.collection("exchangeRequests")
          .where("targetOwnerId", "==", userId);
      break;
    default:
      query = db.collection("exchangeRequests")
          .where("requesterId", "==", userId);
      break;
  }

  const snapshot = await query.orderBy("createdAt", "desc").get();
  const requests = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {requests};
}

/**
 * Get all available books
 */
async function getAllBooks(data, context) {
  const {limit = 20, lastDocId, searchTerm} = data;

  const db = admin.firestore();
  let query = db.collection("books")
      .where("status", "==", "available")
      .orderBy("createdAt", "desc");

  if (lastDocId) {
    const lastDoc = await db.collection("books").doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  let books = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Simple text search
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    books = books.filter((book) =>
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower),
    );
  }

  return {
    books,
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
}

module.exports = {
  addBookForExchange,
  findMatchingBooks,
  initiateExchangeRequest,
  manageExchangeStatus,
  getUserExchangeRequests,
  getAllBooks,
};
