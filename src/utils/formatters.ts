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
