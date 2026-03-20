# HIE Lab Website

Website for the **Health Informatics Equity Lab** directed by Dr. Charlene Ronquillo at the University of British Columbia Okanagan.

Live at: [charleneronquillo.com](https://charleneronquillo.com)

## Directory Structure

```
/
├── index.html              Main page
├── style.css               Stylesheet
├── script.js               Dynamic content loading
├── content.json            All editable site content
├── publications.json       Auto-generated publication list
├── CNAME                   Custom domain config
├── EDITING-GUIDE.md        Guide for updating content
├── .github/workflows/
│   └── update-publications.yml
├── scripts/
│   ├── fetch_publications.py
│   └── requirements.txt
└── assets/
    ├── fonts/              Ubuntu-B.ttf, Poppins-Regular.ttf
    ├── images/             Logos, director photo, team photos
    ├── icons/              Brand icons (SVG)
    └── patterns/           Background patterns (SVG)
```

## Deployment (GitHub Pages)

1. Push repository to GitHub
2. Go to **Settings > Pages**
3. Set source to **Deploy from a branch**, select **main** branch, root `/`
4. Save

## Custom Domain (charleneronquillo.com)

### DNS Configuration

At your domain registrar, add the following records:

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | `<username>.github.io` |

Replace `<username>` with the GitHub username or organisation hosting the repository.

After DNS propagates (up to 48 hours), enable **Enforce HTTPS** in GitHub Pages settings.

## Automated Publication Updates

Publications are fetched weekly from [Google Scholar](https://scholar.google.com/citations?user=6qKKv3EAAAAJ&hl=en) via a GitHub Actions workflow.

- **Schedule**: Every Monday at 06:00 UTC
- **Manual trigger**: Go to **Actions > Update Publications > Run workflow**
- **How it works**: A Python script uses `scholarly` to fetch publications, formats them in Vancouver citation style, enriches DOIs via CrossRef, and commits `publications.json`

## Updating Content

See [EDITING-GUIDE.md](EDITING-GUIDE.md) for step-by-step instructions on updating team members, news, and other content without any programming knowledge.
