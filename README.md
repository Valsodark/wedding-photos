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

## Notes

- Each file uploads as its own request (no batching) — more reliable on flaky wedding wifi, and shows per-file status.
- Guest name gets prefixed to uploaded filename so you know who sent what.
- Apps Script free tier: 50MB/request soft limit, generous daily quota — plenty for a wedding.
- Re-deploying the script after edits: Deploy → Manage deployments → edit → New version, or the URL changes.
