# Wedding Photo Upload Site

Static page → Cloudflare Worker → R2 bucket. Guests open a link, pick photos, and
each one streams straight into object storage.

The page is in Bulgarian.

## Setup

You need a Cloudflare account (free) and Node installed.

1. **Install wrangler and log in**

   ```
   npm install -g wrangler
   wrangler login
   ```

2. **Create the bucket**

   ```
   wrangler r2 bucket create wedding-photos
   ```

   If you name it something else, change `bucket_name` in `worker/wrangler.toml` to match.

3. **Deploy the Worker**

   ```
   cd worker
   wrangler deploy
   ```

   It prints a URL like `https://wedding-photos.<your-subdomain>.workers.dev`. Copy it.

4. **Point the page at it**

   Open `index.html` and replace `PASTE_YOUR_WORKER_URL_HERE` in `UPLOAD_URL` with that URL.

5. **Host the page**

   GitHub Pages (Settings → Pages → deploy from `main`, root), or drag the folder onto
   [Netlify Drop](https://app.netlify.com/drop). The Worker allows any origin, so it
   works from anywhere, including a local file.

6. **Test**: open the page, type a name, pick a photo, send. Then check it landed:

   ```
   wrangler r2 object get wedding-photos --remote --prefix ""
   ```

7. **Make it yours**: names live in the `.eyebrow` line near the top of the `<body>`,
   headline in the `<h1>` under it.

## Getting the photos out afterwards

R2 is object storage, not a folder you open in a browser. Easiest is
[rclone](https://rclone.org):

```
rclone config          # new remote, type: s3, provider: Cloudflare
rclone copy r2:wedding-photos ./photos -P
```

Files are laid out as `<guest name>/<upload id>__<original filename>`, so everything
one person sent is grouped together.

## Notes

- One file per request, one at a time. Slower in theory, but on venue wifi it beats
  parallel uploads and keeps peak memory on the phone low.
- Files go up as-is. The old Apps Script backend needed base64, which inflated every
  file by a third and built the whole thing as a string in memory first.
- Progress is real: uploads go through `XMLHttpRequest` so `upload.onprogress` is
  available. `fetch` cannot report upload progress at all.
- Each tile shows progress by filling in from the bottom — grey means not sent, full
  colour with a check means it's in the bucket.
- A failed file retries twice with backoff, then offers a Retry button. Each file
  carries an `uploadId` that stays the same across retries, and the Worker writes to a
  key built from it, so a retry overwrites the earlier attempt instead of leaving a
  duplicate. That matters because a file can upload completely and still fail if the
  response is lost on the way back.
- There is no upload deadline. A watchdog aborts only when bytes actually stop moving
  for 90 seconds, so a long video on slow wifi is fine.
- Size and MIME type are checked in the Worker, not just the browser. The endpoint is
  public, so the browser's word cannot be what decides what lands in the bucket.
  Limit is 95MB — Workers cap a request body at 100MB.
- Guest names keep their Cyrillic. An earlier version sanitised filenames with a
  Latin-only whitelist, which silently erased every Bulgarian name.
- Typefaces are Literata / Golos Text / IBM Plex Mono because all three ship Cyrillic.
  Swapping in a Latin-only face drops the page to a Georgia fallback.

## Cost

R2 gives 10GB storage free, then about $0.015/GB/month, with no egress charge. A
wedding producing 30GB costs roughly $0.30/month to keep. Workers free tier is
100,000 requests/day; a wedding uses a few thousand.

Confirm current prices on Cloudflare's pricing page before relying on these numbers.

## Previous backend

`apps-script/Code.gs` is the earlier Google Drive backend, kept as a fallback. It works
but has real limits for this use: Drive's 15GB is shared with Gmail, Apps Script allows
only ~30 simultaneous executions (about 15 guests uploading at once), and base64 caps
files near 32MB. If you use it, fix the filename sanitiser first — its Latin-only
whitelist deletes Cyrillic guest names entirely.
