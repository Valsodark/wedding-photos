# Wedding Photo Upload Site

Static page → Google Apps Script → your Drive folder. No server, no cost.

## Setup

1. **Drive folder**: create folder in Drive (e.g. "Wedding Photos"). Open it, copy the ID from URL: `drive.google.com/drive/folders/<THIS_PART>`.

2. **Apps Script backend**:
   - Go to [script.google.com](https://script.google.com) → New project.
   - Delete default code, paste contents of `apps-script/Code.gs`.
   - Replace `FOLDER_ID` value with the ID from step 1.
   - Deploy → New deployment → type: **Web app**.
     - Execute as: **Me**
     - Who has access: **Anyone**
   - Authorize when prompted. Copy the **Web app URL**.

3. **Frontend**:
   - Open `index.html`, replace `SCRIPT_URL` with the Web app URL from step 2.
   - Host it anywhere static: GitHub Pages, Netlify (drag-drop the folder), Vercel, or even just double-click to open locally — Apps Script accepts cross-origin POSTs regardless of origin.

4. Test: open the page, pick a name + photo, upload, check Drive folder.

5. **Make it yours**: edit the eyebrow line in `index.html` (marked `<!-- EDIT: your names and date -->`) and the headline below it.

## Notes

- Each file uploads as its own request (no batching) — more reliable on flaky wedding wifi, and gives every photo its own progress bar. Two go up at a time.
- Progress is real, not faked: uploads go through `XMLHttpRequest` so `upload.onprogress` is available. `fetch` can't report upload progress.
- Each tile shows progress by filling in from the bottom — grey and dim means not sent yet, full colour with a check means it's in the album.
- A failed file retries itself once, then offers a Retry button on the tile.
- Guest name gets prefixed to uploaded filename so you know who sent what.
- Apps Script caps a request near 50MB and base64 inflates a file ~33%, so the page refuses anything over 32MB up front (`MAX_MB` in `index.html`).
- Re-deploying the script after edits: Deploy → Manage deployments → edit → New version, or the URL changes.
