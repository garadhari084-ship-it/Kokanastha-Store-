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

export async function saveSupabaseConfig(url: string, key: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kokanastha_supabase_url', url.trim());
    localStorage.setItem('kokanastha_supabase_key', key.trim());
    try {
      await fetch('/api/config/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), key: key.trim() })
      }).catch(() => {});
    } catch (_) {}
  }
}

export async function clearSupabaseConfig(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kokanastha_supabase_url');
    localStorage.removeItem('kokanastha_supabase_key');
    localStorage.removeItem('supabase_project_url');
    localStorage.removeItem('supabase_anon_key');
    try {
      await fetch('/api/config/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: '', key: '' })
      }).catch(() => {});
    } catch (_) {}
  }
}

export async function fetchServerSupabaseConfig(): Promise<{ url: string; key: string } | null> {
  try {
    const res = await fetch('/api/config/supabase');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return null;
      }
      const data = await res.json().catch(() => null);
      if (data?.url && data?.key) {
        return { url: data.url.trim(), key: data.key.trim() };
      }
    }
  } catch (_) {}
  return null;
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

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    cachedClient = null;
    cachedUrl = '';
    cachedKey = '';
    return null;
  }
  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }
  try {
    cachedUrl = url;
    cachedKey = key;
    cachedClient = createClient(url, key);
    return cachedClient;
  } catch (err) {
    console.warn('Error creating Supabase client:', err);
    return null;
  }
}

export function checkIsSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export function getSupabaseUrl(): string {
  return getSupabaseConfig().url;
}

export function getSupabaseAnonKey(): string {
  return getSupabaseConfig().key;
}

// Deprecated constant getters maintained for compatibility
export const supabaseUrl = getSupabaseConfig().url;
export const supabaseAnonKey = getSupabaseConfig().key;

export const isSupabaseConfigured = checkIsSupabaseConfigured();

export const supabase: SupabaseClient | null = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      return undefined;
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});

/**
 * Uploads an image to Supabase Storage and returns its public URL accessible by any user.
 * If Supabase is configured, uploads to Supabase storage bucket 'tenant-assets' (or 'public').
 * Falls back to optimized local compressed Data URL if Supabase bucket fails or is offline.
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  folderName: string = 'tenant'
): Promise<string> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const bucketName = 'tenant-assets';
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${folderName}/${Date.now()}_${cleanFileName}.${fileExt}`;

      // Upload file directly to Supabase storage bucket 'tenant-assets'
      const { data, error } = await client.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = client.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }

      // Try 'public' bucket if 'tenant-assets' bucket was not found
      if (error && (error.message?.includes('not found') || (error as any).statusCode === '404')) {
        const altRes = await client.storage
          .from('public')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!altRes.error) {
          const { data: publicUrlData } = client.storage
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

