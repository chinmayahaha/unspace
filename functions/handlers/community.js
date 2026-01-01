const admin = require("firebase-admin");
const {logUserAction} = require("../services/analytics");

/**
 * Create a new community post
 */
async function createPost(data, context) {
  const {title, content, category, tags, imageUrl} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const db = admin.firestore();
  const postRef = db.collection("posts").doc();

  const postData = {
    id: postRef.id,
    title,
    content,
    category: category || "general",
    tags: tags || [],
    imageUrl: imageUrl || "",
    authorId: userId,
    status: "active",
    likes: 0,
    comments: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await postRef.set(postData);

  // Log analytics
  await logUserAction(userId, "post_created", {
    postId: postRef.id,
    category,
    tags: tags || [],
  });

  // Trigger AI content moderation
  await db.collection("aiTasks").doc().set({
    type: "moderateContent",
    contentId: postRef.id,
    contentType: "post",
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {postId: postRef.id, ...postData};
}

/**
 * Get posts with filtering and pagination
 */
async function getPosts(data, context) {
  const {
    category,
    searchTerm,
    limit = 20,
    lastDocId,
    sortBy = "createdAt",
  } = data;

  const db = admin.firestore();
  let query = db.collection("posts")
      .where("status", "==", "active");

  // Apply category filter
  if (category) {
    query = query.where("category", "==", category);
  }

  // Apply sorting
  const sortField = sortBy === "likes" ? "likes" : "createdAt";
  const sortOrder = sortBy === "likes" ? "desc" : "desc";
  query = query.orderBy(sortField, sortOrder);

  // Pagination
  if (lastDocId) {
    const lastDoc = await db.collection("posts").doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  let posts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Simple text search
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    posts = posts.filter((post) =>
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }

  return {
    posts,
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
}

/**
 * Get a single post by ID
 */
async function getPost(data, context) {
  const {postId} = data;

  if (!postId) {
    throw new Error("Post ID is required");
  }

  const db = admin.firestore();
  const postDoc = await db.collection("posts").doc(postId).get();

  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  const post = {id: postDoc.id, ...postDoc.data()};

  // Log view analytics
  if (context.auth?.uid) {
    await logUserAction(context.auth.uid, "post_viewed", {
      postId,
      authorId: post.authorId,
    });
  }

  return post;
}

/**
 * Delete a post
 */
async function deletePost(data, context) {
  const {postId} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!postId) {
    throw new Error("Post ID is required");
  }

  const db = admin.firestore();
  const postRef = db.collection("posts").doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  const post = postDoc.data();
  if (post.authorId !== userId) {
    throw new Error("Not authorized to delete this post");
  }

  await postRef.update({
    status: "deleted",
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Log analytics
  await logUserAction(userId, "post_deleted", {
    postId,
    category: post.category,
  });

  return {success: true};
}

/**
 * Add a comment to a post
 */
async function addComment(data, context) {
  const {postId, content, parentCommentId} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!postId || !content) {
    throw new Error("Post ID and content are required");
  }

  const db = admin.firestore();

  // Verify post exists
  const postDoc = await db.collection("posts").doc(postId).get();
  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  const commentRef = db.collection("comments").doc();
  const commentData = {
    id: commentRef.id,
    postId,
    content,
    authorId: userId,
    parentCommentId: parentCommentId || null,
    status: "active",
    likes: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await commentRef.set(commentData);

  // Update post comment count
  await db.collection("posts").doc(postId).update({
    comments: admin.firestore.FieldValue.increment(1),
  });

  // Log analytics
  await logUserAction(userId, "comment_added", {
    commentId: commentRef.id,
    postId,
    parentCommentId: parentCommentId || null,
  });

  // Trigger AI content moderation
  await db.collection("aiTasks").doc().set({
    type: "moderateContent",
    contentId: commentRef.id,
    contentType: "comment",
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {commentId: commentRef.id, ...commentData};
}

/**
 * Get comments for a post
 */
async function getComments(data, context) {
  const {postId, limit = 50, lastDocId} = data;

  if (!postId) {
    throw new Error("Post ID is required");
  }

  const db = admin.firestore();
  let query = db.collection("comments")
      .where("postId", "==", postId)
      .where("status", "==", "active")
      .orderBy("createdAt", "asc");

  if (lastDocId) {
    const lastDoc = await db.collection("comments").doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const comments = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    comments,
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
}

/**
 * Like/unlike a post
 */
async function togglePostLike(data, context) {
  const {postId} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  if (!postId) {
    throw new Error("Post ID is required");
  }

  const db = admin.firestore();
  const likeRef = db.collection("post_likes").doc(`${postId}_${userId}`);
  const likeDoc = await likeRef.get();

  const postRef = db.collection("posts").doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  if (likeDoc.exists) {
    // Unlike
    await likeRef.delete();
    await postRef.update({
      likes: admin.firestore.FieldValue.increment(-1),
    });

    await logUserAction(userId, "post_unliked", {postId});
    return {liked: false};
  } else {
    // Like
    await likeRef.set({
      postId,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await postRef.update({
      likes: admin.firestore.FieldValue.increment(1),
    });

    await logUserAction(userId, "post_liked", {postId});
    return {liked: true};
  }
}

/**
 * Post official announcement (admin only)
 */
async function postOfficialAnnouncement(data, context) {
  const {title, content, priority = "normal"} = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new Error("Authentication required");
  }

  // Check if user is admin
  const db = admin.firestore();
  const adminDoc = await db.collection("admins").doc(userId).get();
  if (!adminDoc.exists) {
    throw new Error("Admin access required");
  }

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const announcementRef = db.collection("posts").doc();
  const announcementData = {
    id: announcementRef.id,
    title,
    content,
    category: "announcement",
    tags: ["official", "announcement"],
    authorId: userId,
    status: "active",
    priority,
    official: true,
    likes: 0,
    comments: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await announcementRef.set(announcementData);

  // Log analytics
  await logUserAction(userId, "announcement_posted", {
    announcementId: announcementRef.id,
    priority,
  });

  return {announcementId: announcementRef.id, ...announcementData};
}

module.exports = {
  createPost,
  getPosts,
  getPost,
  deletePost,
  addComment,
  getComments,
  togglePostLike,
  postOfficialAnnouncement,
};
