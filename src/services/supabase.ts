import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { compressImageFile } from '../utils/imageCompressor';

export function getSupabaseConfig(): { url: string; key: string } {
  if (typeof window === 'undefined') {
    return { url: '', key: '' };
  }
  try {
    const storedUrl = localStorage.getItem('kokanastha_supabase_url') || localStorage.getItem('supabase_project_url') || '';
    const storedKey = localStorage.getItem('kokanastha_supabase_key') || localStorage.getItem('supabase_anon_key') || '';
    
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

    return {
      url: (storedUrl || envUrl || '').trim(),
      key: (storedKey || envKey || '').trim(),
    };
  } catch (_) {
    return { url: '', key: '' };
  }
}

export function saveSupabaseConfig(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kokanastha_supabase_url', url.trim());
    localStorage.setItem('kokanastha_supabase_key', key.trim());
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kokanastha_supabase_url');
    localStorage.removeItem('kokanastha_supabase_key');
    localStorage.removeItem('supabase_project_url');
    localStorage.removeItem('supabase_anon_key');
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!url || !key) {
      return { success: false, error: 'Project URL and Anon Key are required.' };
    }
    const cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('https://')) {
      return { success: false, error: 'Supabase URL must start with https://' };
    }
    const client = createClient(cleanUrl, key.trim(), {
      auth: { persistSession: false }
    });
    
    // Attempt a lightweight fetch from supabase
    const { error } = await client.from('businesses').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, we still check if the key is unauthorized
      if (error.message?.toLowerCase().includes('jwt') || error.code === '401' || (error as any).status === 401) {
        return { success: false, error: 'Invalid Supabase Anon/Public Key (Unauthorized).' };
      }
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Could not connect to Supabase.' };
  }
}

const { url: initialUrl, key: initialKey } = getSupabaseConfig();
export const supabaseUrl = initialUrl;
export const supabaseAnonKey = initialKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
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

