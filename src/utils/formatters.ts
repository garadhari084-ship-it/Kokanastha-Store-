export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  
  // Remove leading zero if present
  if (clean.startsWith('0')) {
    clean = clean.slice(1);
  }

  // Default to Indian country code (+91) if 10 digits
  if (clean.length === 10) {
    clean = `91${clean}`;
  }

  return clean;
}

export function formatDisplayPhone(phone: string): string {
  const clean = formatWhatsAppPhone(phone);
  if (!clean) return '';
  if (clean.startsWith('91') && clean.length === 12) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return `+${clean}`;
}

export function formatOrderTime(timeStr?: string, createdAtStr?: string): string {
  if (timeStr && timeStr.trim()) {
    const trimmed = timeStr.trim();
    // If it already contains AM or PM
    if (/am|pm/i.test(trimmed)) {
      return trimmed;
    }
    // Parse 24-hour HH:MM or HH:MM:SS format
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (!isNaN(h) && !isNaN(m)) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
      }
    }
    return trimmed;
  }

  if (createdAtStr) {
    const d = new Date(createdAtStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  return '10:15 AM';
}

export function normalizeToYMD(dateVal?: string | null): string {
  if (!dateVal) return '';
  const clean = dateVal.trim().split('T')[0];
  if (!clean) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(clean)) {
    const parts = clean.split(/[-\/]/);
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      if (day > 12 && month <= 12) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else if (month > 12 && day <= 12) {
        return `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
      }
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return clean;
  } catch (_) {
    return '';
  }
}
