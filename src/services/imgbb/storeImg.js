/**
 * Convert File to base64 string
 * @param file - File object to convert
 * @returns Promise with base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:image/xxx;base64, prefix
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Upload an image to imgbb
 * @param file - File object to upload
 * @returns Promise with the uploaded image URL
 */
export async function uploadImageToImgbb(file) {
  try {
    // Check if API key exists
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      console.error('❌ imgbb API key is missing!');
      console.log('📝 Please add NEXT_PUBLIC_IMGBB_API_KEY to your .env.local file');
      console.log('🔗 Get your API key from: https://api.imgbb.com/');
      throw new Error('imgbb API key is not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your .env.local file');
    }

    console.log('📤 Uploading image:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);

    // Convert file to base64
    const base64Image = await fileToBase64(file);
    
    const formData = new FormData();
    formData.append("image", base64Image);
    
    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: "POST",
        body: formData,
      }
    );
    
    const resData = await res.json();
    
    if (!res.ok || !resData.success) {
      const errorMsg = resData.error?.message || 'Failed to upload image to imgbb';
      console.error('❌ imgbb upload failed:', errorMsg);
      console.log('Response:', resData);
      throw new Error(errorMsg);
    }
    
    console.log('✅ Image uploaded successfully:', resData.data.url);
    return resData.data.url;
  } catch (error) {
    console.error('❌ Error uploading image to imgbb:', error.message);
    throw error;
  }
}

/**
 * Upload multiple images to imgbb
 * @param files - Array of File objects to upload
 * @returns Promise with array of uploaded image URLs
 */
export async function uploadMultipleImagesToImgbb(files) {
  try {
    const uploadPromises = files.map(file => uploadImageToImgbb(file));
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
  } catch (error) {
    console.error('Error uploading multiple images to imgbb:', error);
    throw error;
  }
}

export default uploadImageToImgbb;
