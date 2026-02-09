export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function filenameFromDisposition(disposition, fallback) {
  try {
    if (!disposition) return fallback;
    // supports filename*=UTF-8''...
    const fnStar = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (fnStar?.[1]) return decodeURIComponent(fnStar[1]);
    const fn = disposition.match(/filename="?([^;"]+)"?/i);
    if (fn?.[1]) return fn[1];
    return fallback;
  } catch {
    return fallback;
  }
}
