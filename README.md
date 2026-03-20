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

## Deployment

Hosted via GitHub Pages with a custom domain. See GitHub Pages documentation for setup details.

## Automated Publication Updates

Publications are fetched weekly from [Google Scholar](https://scholar.google.com/citations?user=6qKKv3EAAAAJ&hl=en) via a GitHub Actions workflow.

- **Schedule**: Every Monday at 06:00 UTC
- **Manual trigger**: Go to **Actions > Update Publications > Run workflow**
- **How it works**: A Python script uses `scholarly` to fetch publications, formats them in Vancouver citation style, enriches DOIs via CrossRef, and commits `publications.json`

## Updating Content

See [EDITING-GUIDE.md](EDITING-GUIDE.md) for step-by-step instructions on updating team members, news, and other content without any programming knowledge.
