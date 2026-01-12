const admin = require("firebase-admin");
const {logUserAction} = require("../services/analytics");

/**
 * HELPER: Unwraps data safely
 */
function unwrapData(data) {
  if (!data) return {}; 
  if (typeof data === 'object' && data.data) {
    return data.data;
  }
  return data;
}

/**
 * HELPER: Get User ID (With Emulator Fallback)
 * This allows you to test ALL features on localhost without auth errors.
 */
function getUserId(context) {
  // 1. Try real Auth
  if (context.auth && context.auth.uid) {
    return context.auth.uid;
  }
  // 2. Emulator Fallback
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || 
                     process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (isEmulator) {
    return "emulator-test-user-123"; 
  }
  return null;
}

/**
 * 1. Add a Book
 * UPDATED: Handles new form fields (Course, Semester, Image) + Auth Bypass
 */
async function addBookForExchange(data, context) {
  const userId = getUserId(context); 
  if (!userId) throw new Error("Authentication required");

  const input = unwrapData(data);
  // Destructure all fields
  const {
      title, author, isbn, condition, 
      description, imageUrl, course, 
      semester, price, edition
  } = input;

  if (!title || !author) {
    throw new Error("Title and author are required");
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
    imageUrl: imageUrl || "", // Stores Base64 string directly
    course: course || "",
    semester: semester || "",
    price: price ? parseFloat(price) : 0,
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await bookRef.set(bookData);

  // Silent Analytics
  try {
      await logUserAction(userId, "book_added", {
        bookId: bookRef.id,
        title,
        course
      });
  } catch (e) {
      console.warn("Analytics log failed", e);
  }

  return {bookId: bookRef.id, success: true};
}

/**
 * 2. Find matching books for exchange
 */
async function findMatchingBooks(data, context) {
  const input = unwrapData(data);
  const {userId: targetUserId, bookId} = input;
  
  const currentUserId = getUserId(context); // Updated to use Helper
  if (!currentUserId) throw new Error("Authentication required");

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
    if (!targetBookDoc.exists) throw new Error("Book not found");

    const targetBook = targetBookDoc.data();
    if (targetBook.ownerId === currentUserId) {
      throw new Error("Cannot exchange with yourself");
    }

    // Find books by the same author or similar genre (simple logic for now)
    const matchesSnapshot = await db.collection("books")
        .where("ownerId", "==", targetBook.ownerId)
        .where("status", "==", "available")
        .get();

    const matches = matchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { targetBook, userBooks, matches };
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

    return { userBooks, targetBooks };
  }

  return {matches: []};
}



/**
 * 3. Initiate exchange request (FIXED: Supports simple requests + Notifications)
 */
async function initiateExchangeRequest(data, context) {
  const input = unwrapData(data);
  const {targetBookId, offeredBookId, message} = input;
  
  const userId = getUserId(context); 
  if (!userId) throw new Error("Authentication required");

  if (!targetBookId) {
    throw new Error("Target book ID is required");
  }

  const db = admin.firestore();

  // 1. Get the target book
  const targetBookDoc = await db.collection("books").doc(targetBookId).get();
  if (!targetBookDoc.exists) throw new Error("Target book not found");
  const targetBook = targetBookDoc.data();

  if (targetBook.ownerId === userId) {
    throw new Error("Cannot request your own book");
  }

  // 2. (Optional) Validate offered book if provided
  let offeredBookData = null;
  if (offeredBookId) {
      const offeredDoc = await db.collection("books").doc(offeredBookId).get();
      if (offeredDoc.exists) {
          offeredBookData = offeredDoc.data();
          if (offeredBookData.ownerId !== userId) throw new Error("You don't own the offered book");
      }
  }

  // 3. Create Request
  const exchangeRef = db.collection("exchangeRequests").doc();
  await exchangeRef.set({
    id: exchangeRef.id,
    requesterId: userId,
    targetBookId,
    offeredBookId: offeredBookId || null, // Can be null now
    targetOwnerId: targetBook.ownerId,
    message: message || "I am interested in this book.",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 4. SEND NOTIFICATION (So it shows up on Dashboard!)
  await db.collection("notifications").add({
    toUserId: targetBook.ownerId,
    fromUserId: userId,
    type: "book_request",
    message: message || "I'm interested in your book!",
    item: targetBook.title,
    itemId: targetBookId,
    relatedId: exchangeRef.id, // Link to the exchange request
    createdAt: new Date(),
    read: false
  });

  return {exchangeId: exchangeRef.id, status: "pending", success: true};
}

/**
 * 4. Manage exchange status (accept/decline)
 */
async function manageExchangeStatus(data, context) {
  const input = unwrapData(data);
  const {exchangeId, action} = input;
  
  const userId = getUserId(context); // Updated to use Helper
  if (!userId) throw new Error("Authentication required");

  if (!exchangeId || !action) {
    throw new Error("Exchange ID and action are required");
  }

  if (!["accept", "decline"].includes(action)) {
    throw new Error("Action must be 'accept' or 'decline'");
  }

  const db = admin.firestore();
  const exchangeRef = db.collection("exchangeRequests").doc(exchangeId);
  const exchangeDoc = await exchangeRef.get();

  if (!exchangeDoc.exists) throw new Error("Exchange request not found");

  const exchange = exchangeDoc.data();

  //Only the target owner can accept/decline
  if (exchange.targetOwnerId !== userId) {
    throw new Error("Not authorized to manage this exchange");
  }

  if (exchange.status !== "pending") {
    throw new Error("Exchange request is no longer pending");
  }

  const updateData = {
    status: action === "accept" ? "accepted" : "declined",
    updatedAt: new Date(),
  };

  if (action === "accept") {
    updateData.acceptedAt = new Date();

    // Mark both books as exchanged
    await Promise.all([
      db.collection("books").doc(exchange.targetBookId).update({
        status: "exchanged",
        exchangedAt: new Date(),
      }),
      db.collection("books").doc(exchange.offeredBookId).update({
        status: "exchanged",
        exchangedAt: new Date(),
      }),
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

  return {success: true, status: updateData.status};
}

/**
 * 5. Get user's exchange requests
 */
async function getUserExchangeRequests(data, context) {
  const input = unwrapData(data);
  const {type = "all"} = input; // "sent", "received", "all"
  
  const userId = getUserId(context); // Updated to use Helper
  if (!userId) throw new Error("Authentication required");

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
  const requests = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {requests};
}

/**
 * 6. Get all available books
 */
async function getAllBooks(data, context) {
  const input = unwrapData(data);
  const {limit = 20, lastDocId, searchTerm} = input;

  const db = admin.firestore();
  let query = db.collection("books")
      .where("status", "==", "available")
      .orderBy("createdAt", "desc");

  if (lastDocId) {
    const lastDoc = await db.collection("books").doc(lastDocId).get();
    if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
    }
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
      book.author.toLowerCase().includes(searchLower) ||
      (book.course && book.course.toLowerCase().includes(searchLower))
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