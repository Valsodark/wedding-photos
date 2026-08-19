// Receives one file per request and streams it straight into R2.
//
// Nothing is base64-encoded on the way in, so a phone can send a 90MB video
// without first building a 120MB string in memory, and the Worker never holds
// the whole file either — the request body is piped into the bucket.

const MAX_BYTES = 95 * 1024 * 1024;   // Workers free plan caps a request body at 100MB

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-guest, x-filename, x-upload-id',
  'Access-Control-Max-Age': '86400'
};

const reply = (body, status = 200) => Response.json(body, { status, headers: CORS });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'PUT') return reply({ success: false, error: 'Method not allowed' }, 405);

    try {
      // The browser enforces these too, but the endpoint is public, so it
      // cannot be the browser's word that decides what lands in the bucket.
      const type = request.headers.get('content-type') || '';
      if (!/^(image|video)\//.test(type)) {
        return reply({ success: false, error: 'Разрешени са само снимки и видео' }, 415);
      }
      if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) {
        return reply({ success: false, error: 'Файлът е твърде голям' }, 413);
      }

      const guest = readHeader(request, 'x-guest') || 'Гост';
      const name = readHeader(request, 'x-filename') || 'снимка';

      // The client sends the same id on every retry of the same file. Writing
      // to a fixed key makes a retry overwrite the earlier attempt instead of
      // leaving a duplicate behind — which is what happens when a file uploads
      // fully but the response is lost on the way back.
      const uploadId = readHeader(request, 'x-upload-id') || crypto.randomUUID();

      const key = `${clean(guest)}/${uploadId}__${clean(name)}`;

      await env.PHOTOS.put(key, request.body, {
        httpMetadata: { contentType: type },
        customMetadata: { guest, uploadedAt: new Date().toISOString() }
      });

      return reply({ success: true, key });
    } catch (err) {
      return reply({ success: false, error: err.message || 'Неуспешен запис' }, 500);
    }
  }
};

// HTTP headers are Latin-1 only, so the page percent-encodes anything Cyrillic.
function readHeader(request, name) {
  const raw = request.headers.get(name);
  if (!raw) return '';
  try { return decodeURIComponent(raw); } catch (e) { return raw; }
}

// Keep Cyrillic — a whitelist of Latin letters would erase every guest name.
// Drop only control characters and the punctuation that breaks an object key
// or a later download.
const FORBIDDEN = '/\\:*?"<>|';

function clean(s) {
  const kept = String(s)
    .normalize('NFC')
    .split('')
    .filter(ch => ch.charCodeAt(0) > 31 && FORBIDDEN.indexOf(ch) === -1)
    .join('');

  return kept.replace(/\s+/g, ' ').trim().slice(0, 80) || 'файл';
}
