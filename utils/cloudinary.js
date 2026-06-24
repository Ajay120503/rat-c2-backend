const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder (e.g., 'rat_photos' or 'rat_recordings')
 * @param {string} fileName - Original file name
 * @param {Object} options - Additional options (resource_type, etc.)
 */
async function uploadToCloudinary(buffer, folder, fileName, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      public_id: `${Date.now()}_${fileName.replace(/\.[^.]+$/, '')}`,
      resource_type: options.resource_type || 'auto',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });

    stream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by its public_id
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - 'image', 'video', or 'raw' (audio)
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
    return { result: 'error', error: error.message };
  }
}

/**
 * Delete all files in a folder from Cloudinary
 * @param {string} folderPrefix - Folder prefix (e.g., 'rat_photos/deviceId')
 */
async function deleteCloudinaryFolder(folderPrefix) {
  try {
    // List all resources in the folder
    const resources = [];
    let nextCursor = null;

    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPrefix,
        max_results: 500,
        next_cursor: nextCursor,
      });
      resources.push(...result.resources);
      nextCursor = result.next_cursor;
    } while (nextCursor);

    // Delete each resource
    const deleteResults = await Promise.all(
      resources.map((resource) =>
        cloudinary.uploader.destroy(resource.public_id, {
          resource_type: resource.resource_type,
        })
      )
    );

    // Also delete the folder itself (Cloudinary doesn't auto-delete empty folders)
    try {
      await cloudinary.api.delete_folder(folderPrefix);
    } catch (e) {
      // Folder might not exist or might have subfolders
    }

    return { deleted: resources.length, results: deleteResults };
  } catch (error) {
    console.error('Cloudinary folder delete error:', error.message);
    return { deleted: 0, error: error.message };
  }
}

/**
 * Extract public_id from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @param {string} resourceType - 'image', 'video', or 'raw'
 */
function extractPublicId(url, resourceType = 'image') {
  if (!url) return null;
  try {
    // URL format: https://res.cloudinary.com/cloud_name/resource_type/upload/v12345/folder/public_id.ext
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Get everything after version or after 'upload' if no version
    const afterUpload = parts.slice(uploadIndex + 1);
    // Remove version if present (starts with 'v')
    const withoutVersion = afterUpload.filter((p) => !p.startsWith('v'));
    // Join with / and remove extension
    const publicId = withoutVersion.join('/').replace(/\.[^.]+$/, '');
    return publicId;
  } catch {
    return null;
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteCloudinaryFolder,
  extractPublicId,
};