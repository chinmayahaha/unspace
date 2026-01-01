// admin not required in this module; storage operations use @google-cloud/storage
const {Storage} = require("@google-cloud/storage");

// Initialize Google Cloud Storage
const storage = new Storage();

/**
 * Upload file to Firebase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} folder - Folder path in storage
 * @param {string} contentType - MIME type
 */
async function uploadFile(fileBuffer, fileName, folder = "uploads", contentType = "image/jpeg") {
  try {
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const filePath = `${folder}/${Date.now()}_${fileName}`;
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType: contentType,
        cacheControl: "public, max-age=31536000",
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return {
      url: publicUrl,
      path: filePath,
      fileName: fileName,
    };
  } catch (error) {
    console.error("File upload failed:", error);
    throw new Error("File upload failed");
  }
}

/**
 * Delete file from Firebase Storage
 * @param {string} filePath - File path in storage
 */
async function deleteFile(filePath) {
  try {
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const file = bucket.file(filePath);

    await file.delete();
    console.log(`File deleted: ${filePath}`);
    return true;
  } catch (error) {
    console.error("File deletion failed:", error);
    return false;
  }
}

/**
 * Upload multiple files
 * @param {Array} files - Array of file objects with buffer, name, type
 * @param {string} folder - Folder path
 */
async function uploadMultipleFiles(files, folder = "uploads") {
  const uploadPromises = files.map((file) =>
    uploadFile(file.buffer, file.name, folder, file.type),
  );

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Multiple file upload failed:", error);
    throw new Error("Multiple file upload failed");
  }
}

/**
 * Get file metadata
 * @param {string} filePath - File path in storage
 */
async function getFileMetadata(filePath) {
  try {
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();

    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      created: metadata.timeCreated,
      updated: metadata.updated,
    };
  } catch (error) {
    console.error("Failed to get file metadata:", error);
    return null;
  }
}

/**
 * Generate signed URL for private file access
 * @param {string} filePath - File path in storage
 * @param {number} expirationMinutes - URL expiration in minutes
 */
async function generateSignedUrl(filePath, expirationMinutes = 60) {
  try {
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expirationMinutes * 60 * 1000,
    });

    return signedUrl;
  } catch (error) {
    console.error("Failed to generate signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
}

module.exports = {
  uploadFile,
  deleteFile,
  uploadMultipleFiles,
  getFileMetadata,
  generateSignedUrl,
};
