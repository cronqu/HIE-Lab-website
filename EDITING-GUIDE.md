# Editing Guide

This guide explains how to update the HIE Lab website without any programming knowledge. All editable content lives in a single file: **`content.json`**.

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
