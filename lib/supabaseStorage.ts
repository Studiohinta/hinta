import { supabase } from './supabaseClient';

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (default: 'project-assets')
 * @param folder - Optional folder path within the bucket
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToStorage(
  file: File,
  bucket: string = 'project-assets',
  folder?: string
): Promise<string> {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder ? `${folder}/` : ''}${timestamp}_${randomString}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file to Supabase Storage:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        bucket,
        fileName,
      });
      throw new Error(`Supabase Storage Error: ${error.message || 'Unknown error'}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param fileUrl - The public URL of the file to delete
 * @param bucket - The storage bucket name (default: 'project-assets')
 */
export async function deleteFileFromStorage(
  fileUrl: string,
  bucket: string = 'project-assets'
): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1) {
      console.warn('Could not extract file path from URL:', fileUrl);
      return;
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file from Supabase Storage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteFileFromStorage:', error);
    // Don't throw - file deletion is not critical
  }
}

/**
 * Upload an image for a view
 * @param file - The image file
 * @param projectId - The project ID
 * @returns Public URL of the uploaded image
 */
export async function uploadViewImage(
  file: File,
  projectId: string
): Promise<string> {
  return uploadFileToStorage(file, 'project-assets', `projects/${projectId}/views`);
}

/**
 * Upload a navigation map image
 * @param file - The image file
 * @param projectId - The project ID
 * @returns Public URL of the uploaded image
 */
export async function uploadNavigationMapImage(
  file: File,
  projectId: string
): Promise<string> {
  return uploadFileToStorage(file, 'project-assets', `projects/${projectId}/navigation`);
}

/**
 * Upload a project asset (image, video, document)
 * @param file - The file to upload
 * @param projectId - The project ID
 * @returns Public URL of the uploaded file
 */
export async function uploadProjectAsset(
  file: File,
  projectId: string
): Promise<string> {
  return uploadFileToStorage(file, 'project-assets', `projects/${projectId}/assets`);
}

/**
 * Upload a unit file (PDF, image, etc.)
 * @param file - The file to upload
 * @param projectId - The project ID
 * @param unitId - The unit ID
 * @returns Public URL of the uploaded file
 */
export async function uploadUnitFile(
  file: File,
  projectId: string,
  unitId: string
): Promise<string> {
  return uploadFileToStorage(file, 'project-assets', `projects/${projectId}/units/${unitId}`);
}

