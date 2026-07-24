import { createClient } from '@supabase/supabase-js';
import { compressImageFile } from '../utils/imageCompressor';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Uploads an image to Supabase Storage and returns its public URL accessible by any user.
 * If Supabase is configured, uploads to Supabase storage bucket 'tenant-assets' (or 'public').
 * Falls back to optimized local compressed Data URL if Supabase bucket fails or is offline.
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  folderName: string = 'tenant'
): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    try {
      const bucketName = 'tenant-assets';
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${folderName}/${Date.now()}_${cleanFileName}.${fileExt}`;

      // Upload file directly to Supabase storage bucket 'tenant-assets'
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }

      // Try 'public' bucket if 'tenant-assets' bucket was not found
      if (error && (error.message?.includes('not found') || (error as any).statusCode === '404')) {
        const altRes = await supabase.storage
          .from('public')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!altRes.error) {
          const { data: publicUrlData } = supabase.storage
            .from('public')
            .getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      }

      if (error) {
        console.warn('Supabase storage upload notice:', error.message);
      }
    } catch (err) {
      console.warn('Supabase storage upload exception:', err);
    }
  }

  // Fallback: Compress image and return Data URL
  return await compressImageFile(file);
}

