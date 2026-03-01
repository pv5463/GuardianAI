import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadScreenshot(
  userId: string,
  file: File
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Upload exception:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadAudioFile(
  userId: string,
  file: File
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Upload exception:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFile(
  bucket: 'screenshots' | 'audio-files',
  filePath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

export function getFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => 
      part === 'screenshots' || part === 'audio-files'
    );
    
    if (bucketIndex === -1) return null;
    
    return pathParts.slice(bucketIndex + 1).join('/');
  } catch (error) {
    return null;
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, or WebP images.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit.'
    };
  }

  return { valid: true };
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 25 * 1024 * 1024; // 25MB
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload MP3, WAV, WebM, or M4A audio files.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 25MB limit.'
    };
  }

  return { valid: true };
}
