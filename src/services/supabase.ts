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

export function getSupabaseProjectRef(): string {
  const { url } = getSupabaseConfig();
  const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : 'wtlldxrnuyruxdrdnxcj';
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ 
  success: boolean; 
  error?: string; 
  isDatabaseNotUsable?: boolean; 
  projectRef?: string 
}> {
  try {
    if (!url || !key) {
      return { success: false, error: 'Project URL and Anon Key are required.' };
    }
    const cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('https://')) {
      return { success: false, error: 'Supabase URL must start with https://' };
    }
    const match = cleanUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    const projectRef = match ? match[1] : 'wtlldxrnuyruxdrdnxcj';

    const client = createClient(cleanUrl, key.trim(), {
      auth: { persistSession: false }
    });
    
    // Attempt a lightweight fetch from supabase with a fast 2-second timeout
    const testPromise = client.from('businesses').select('id').limit(1);
    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 2 seconds. The database did not accept a usable connection or is paused.')), 2000)
    );

    const { error } = await Promise.race([testPromise, timeoutPromise]) as any;

    if (error) {
      const code = String(error.code || '');
      const msg = String(error.message || '').toLowerCase();
      const status = (error as any).status || (error as any).statusCode;

      // Missing table (PGRST116, PGRST205, 42P01) means PostgreSQL connection is alive and working!
      const isMissingTable = code === 'PGRST116' || code === 'PGRST205' || code === '42P01' || msg.includes('relation') || msg.includes('does not exist');
      if (isMissingTable) {
        return { success: true, projectRef };
      }

      // Detect "Database not usable" or paused/terminated connection errors
      const isUnusable = 
        msg.includes('not usable') || 
        msg.includes('usable connection') || 
        msg.includes('connection refused') || 
        msg.includes('connection terminated') || 
        msg.includes('timeout') || 
        msg.includes('terminat') ||
        msg.includes('upstream connect error') ||
        msg.includes('disconnect/reset') ||
        status === 503 || 
        status === 500 || 
        status === 502 || 
        status === 504 ||
        code === '57P01' || 
        code === '08006' || 
        code === '08001';

      if (isUnusable) {
        return {
          success: false,
          isDatabaseNotUsable: true,
          projectRef,
          error: 'Database not usable: The database did not accept a usable connection. Please open your Supabase Dashboard and click "Restart Project" (or "Restore Project") in Project Settings.'
        };
      }

      if (msg.includes('jwt') || code === '401' || status === 401) {
        return { success: false, projectRef, error: 'Invalid Supabase Anon/Public Key (Unauthorized).' };
      }

      return { success: false, projectRef, error: error.message || `Database error (${code})` };
    }
    return { success: true, projectRef };
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    const isUnusable = msg.includes('not usable') || msg.includes('usable connection') || msg.includes('timed out') || msg.includes('timeout');
    const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    const projectRef = match ? match[1] : 'wtlldxrnuyruxdrdnxcj';
    return { 
      success: false, 
      isDatabaseNotUsable: isUnusable,
      projectRef,
      error: err.message || 'Could not connect to Supabase.' 
    };
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

