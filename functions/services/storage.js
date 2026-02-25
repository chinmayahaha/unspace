/* functions/services/storage.js */
const admin = require("firebase-admin");

// Helper: Get the bucket from the existing Admin SDK
function getBucket() {
  return admin.storage().bucket(); 
}

/**
 * Upload file to Firebase Storage
 * Used for legacy/emulator support. In production, frontend uploads directly.
 */
async function uploadFile(fileBuffer, fileName, folder = "uploads", contentType = "image/jpeg") {
  try {
    const bucket = getBucket();
    const filePath = `${folder}/${Date.now()}_${fileName}`;
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType: contentType,
        cacheControl: "public, max-age=31536000",
      },
    });

    await file.makePublic();

    // Construct the public URL manually to avoid dependency on @google-cloud/storage
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
 */
async function deleteFile(filePath) {
  try {
    const bucket = getBucket();
    // Handle full URLs or relative paths
    const relativePath = filePath.replace(`https://storage.googleapis.com/${bucket.name}/`, '');
    const file = bucket.file(relativePath);

    await file.delete();
    console.log(`File deleted: ${relativePath}`);
    return true;
  } catch (error) {
    console.warn("File deletion failed (file might not exist):", error.message);
    return false;
  }
}

/**
 * Upload multiple files (Legacy Support)
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
    // Return empty array to prevent crashing the calling function
    return []; 
  }
}

/**
 * Get file metadata
 * Restored functionality using firebase-admin
 */
async function getFileMetadata(filePath) {
  try {
    const bucket = getBucket();
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
 * Generate signed URL
 * Restored functionality using firebase-admin
 */
async function generateSignedUrl(filePath, expirationMinutes = 60) {
  try {
    const bucket = getBucket();
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expirationMinutes * 60 * 1000,
    });

    return signedUrl;
  } catch (error) {
    console.error("Failed to generate signed URL:", error);
    return null;
  }
}

module.exports = {
  uploadFile,
  deleteFile,
  uploadMultipleFiles,
  getFileMetadata,
  generateSignedUrl,
};