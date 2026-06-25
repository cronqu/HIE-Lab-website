# Editing Guide

## Easiest way: the Content Editor UI

Visit **[charleneronquillo.com/admin.html](https://charleneronquillo.com/admin.html)** to update the website using forms instead of editing JSON directly. This is the recommended way — no JSON errors, no syntax to remember.

### First-time setup

1. **Create a GitHub Personal Access Token** at [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
   - Token name: anything, e.g. "HIE Lab Editor"
   - Expiration: 1 year (or whatever you prefer — you'll need to re-create it when it expires)
   - Resource owner: your GitHub account
   - Repository access: **Only select repositories** → choose **cronqu/HIE-Lab-website**
   - Repository permissions → **Contents** → **Read and write**
   - Click *Generate token* and **copy it immediately** (you can't see it again)
2. Open [charleneronquillo.com/admin.html](https://charleneronquillo.com/admin.html)
3. Paste the token in the Connect dialog and click **Connect**

The token is stored only in your browser (localStorage). Sign out to forget it.

### Using the editor

- Pick a tab on the left (News, Team, Research, etc.).
- Add, edit, or delete items using the forms. Drag-order using the ↑ ↓ buttons.
- Click **Save changes** at the top right when ready. The live site updates within a couple of minutes.
- If you close the tab with unsaved changes, your work is saved as a draft and offered back next time you open the editor.

### Inline links in News text

To make a word or phrase clickable in a news entry, write `[label](https://url)`. For example:

`New publication with the [AI-Nurses Network](https://www.ai-nurses.com/) in...`

renders as: "New publication with the AI-Nurses Network in..." where *AI-Nurses Network* is a link.

---

## Manual editing (advanced)

If you'd rather edit `content.json` directly on GitHub, the rest of this guide explains how. All editable content lives in a single file: **`content.json`**.

## How to Edit content.json

1. Go to the repository on GitHub
2. Click on **`content.json`**
3. Click the **pencil icon** (Edit this file) in the top-right corner
4. Make your changes (see examples below)
5. Click **Commit changes**, add a brief description (e.g., "Add new team member"), and click **Commit changes** again
6. The site will update automatically within a few minutes

## Common Tasks

### Add a Team Member

Find the `"current"` array inside `"team"` and add a new entry:

```json
{
  "name": "New Member Name",
  "pronouns": "she/her",
  "role": "Research Assistant",
  "photo": "assets/images/team/lastname.jpg",
  "bio": "Short biography here."
}
```

Add a comma after the previous entry's closing `}` before adding the new one.

**To add their photo**: upload the image to the `assets/images/team/` folder on GitHub (click **Add file > Upload files** in that folder).

### Remove a Team Member

To move someone to alumni, remove their entry from `"current"` and add to `"alumni"`:

```json
{ "name": "Member Name", "role": "Research Assistant, BSN Graduate" }
```

### Update the Director Bio

Find `"director"` > `"bio"` and edit the text inside the square brackets. Each paragraph is a separate string in quotes.

### Add a News Item

Find the `"news"` array and add a new entry at the **top** (newest first):

```json
{
  "date": "2026-03",
  "text": "Description of the news item.",
  "url": "https://optional-link.com"
}
```

The `"url"` field is optional. Remove it (and the comma before it) if there is no link.

### Update Graduate Student Intake Status

Find `"opportunities"` > `"grad_status"` and change the text.

### Add a Teaching Entry

Find the `"teaching"` array and add a new entry:

```json
{
  "year": "2026",
  "courses": [
    "NRSG 543 - Course Name (UBC-O)"
  ]
}
```

## Refreshing Publications

Publications update automatically every Monday. To trigger an immediate update:

1. Go to the repository on GitHub
2. Click the **Actions** tab
3. Click **Update Publications** in the left sidebar
4. Click **Run workflow** > **Run workflow**
5. Wait a few minutes for it to complete

## Tips

- Always use **straight quotes** (`"`) not curly quotes
- Make sure every string is inside quotes
- Add commas between items in a list, but **not** after the last item
- If the site stops loading after an edit, you likely have a JSON syntax error — check for missing commas or quotes
- Use a [JSON validator](https://jsonlint.com/) to check your changes before committing
