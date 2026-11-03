repo: cronqu/HIE-Lab-website
branch: main
path: (whole repo — content.json, style.css, assets/)

## Last sync
date: 2026-08-05

### Updated in this project
- Built the production site: `index.html` (shell + tokens + responsive layout), `script.js` (renders all six panes from `content.json` + `publications.json`, command palette, theme toggle, hash routing), `content.json` (rebuilt as the site's own content file — every string the page shows), `admin.html` (generic recursive editor over `content.json`, download-and-commit workflow), `CNAME`, and nine canonical-tagged redirect stubs for the old URLs.
- Removed every posted email address, in the production build and in the design file (0 `mailto:` links remain). Contact is now a query form — rail "Send a query", the Speaking inquiry button, and the Working-with-me pane all open the same modal. It POSTs as JSON to Web3Forms; the recipient address is bound to the access key server-side, so `charlene.ronquillo@ubc.ca` never appears in the page, in `content.json`, or in the repo.
- `contact.accessKey` in `content.json` is empty: until it holds a Web3Forms key the form validates and then reports that it is not connected. The design file takes the same value as a `contactAccessKey` prop.
- Projects no longer deduplicate against ORCID papers. Awarded grants stay on record permanently and may appear alongside every paper they produced; only paper-to-paper duplication is suppressed (both in the design and in `script.js`).
- Speaking selections (audience / format / timing) travel into the form as an `event_details` field rather than a mailto body.

## Sync history
date: 2026-08-04T21:12:32Z
commit: 3d12bd3c053b

### Updated in this project
- Rewrote `scripts/fetch_publications.py` (v3.0, in this project at the same path, ready to commit): CrossRef's publication date is now kept to month and day precision instead of falling back to ORCID's year-only date; records are deduplicated by normalised title, keeping the one with a DOI and the most precise date; output sorts by full date. New per-record fields `month`, `day`, `date`, `date_precision`. This is what fixes "most recent" meaning something within a year — 87 ORCID records currently collapse to 65 works.
- 2a reads the new month field when present: stream rows label as "APR 2026", the sort uses month, and the lead story's label shows the month.
- Removed the auto-generated plain-language tagline from the lead story (it depended on a host-provided helper that does not exist on GitHub Pages).
- Every clickable element in 2a now lights up on hover: rail nav rows tint rather than dim, stream rows tint, filter chips and year buttons brighten, gallery photos take a yellow outline, profile links go yellow, inquiry selects brighten their rule.

## Sync history
date: 2026-08-04T20:34:02Z
commit: 3d12bd3c053b

### Updated in this project
- Merged `publications.json` (87 records, 65 unique titles) into 2a's What's New stream, deduped inside ORCID, against the hand-written papers, and against hand-written project rows whose published output is now in ORCID. Year density in "Recent years" is derived from the merged list rather than the twelve curated entries — do not hand-record the per-year figures here, they move with every ORCID refresh.
- The lead story is no longer hardcoded: it renders the first record in `publications.json` (ORCID order, newest first) — label, title, Vancouver citation and DOI all derived, journal parsed out of the citation. An optional `leadSummary` prop adds a plain-language line when someone writes one.
- The standalone Publications pane is built but hidden (removed from `PANES2`); restore it by adding the entry back.
- Theme now follows `prefers-color-scheme` with a persisted rail toggle, per Charlene's decision.
- Speaking pane keeps the four-band sliding scale but no longer publishes dollar figures; bands read "Honorarium waived / Standard / Institutional / Commercial rate" and the inquiry form promises a figure by return email.
- Lead-story image is now chosen manually (a `headlineImage` prop) rather than by keyword match, ahead of the admin picker.

## Sync history
date: 2026-08-04T20:06:04Z
commit: 3d12bd3c053b

### Updated in this project
- Copied `assets/images/headlines/FannyMaurel-DigitAmbientScribes-1280x720.png` (Fanny Maurel & Digit, *Ambient Scribes*, Better Images of AI, CC-BY 4.0) and wired it as 2a's lead-story image, with the artist's own alt text and attribution links.
- Added a keyword matcher in 2a that picks the lead image from a nine-entry Better Images of AI catalogue based on the newest Paper in the feed; *Ambient Scribes* wins the current JMIR headline.

## Sync history
date: 2026-07-29T00:55:12Z

### Updated in this project
- Pulled the real HIE PIE Advisory content from `content.json` (intro, four patient partners, bios) into option 2a's People pane; copied their portraits from `assets/images/advisory/` and `assets/images/team/katie-tong.jpeg`.
- Copied the remaining `assets/images/gallery/` photos (002–004, 007, 008, sandpits1–2) and used the repo's `gallery.photos` alt text as captions for 2a's scrolling "From the lab" strip.
- Copied the five missing team portraits (`amrit-kaur-dhami.jpg`, `jianan-wang.jpg`, `hilal-yildirim.jpeg`, `nicole-ketter.jpg`, `diana-shim.jpg`) so every current member in 2a has their real photo instead of an initials tile.
- Renamed 2a's first pane from "Stream" to "What's new" and centred the photo strip.
- Added a Speaking pane (topics plus a four-tier sliding fee scale) — this content does not exist upstream and is a draft awaiting Charlene's review.

## Sync history
date: 2026-07-27T23:21:28Z
- Read the live site's real content (`content.json`), stylesheet tokens, and homepage structure as the basis for a redesign.
- Copied the HIE Lab identity assets: logomark/wordmark SVGs, the six themed brand icons, director photo, team and gallery photos.
- Re-inlined the brand fill colours into the copied SVGs (the copy pipeline strips `<style>` blocks from SVG `<defs>`).
- Built two homepage directions in `HIE Lab Redesign.dc.html` using the repo palette (#2E2A6A / #43C4D9 / #EE447F / #8670B2 / #FEC415) and type pairing (Ubuntu + Poppins).

## Screen map
| Project screen | Built from repo files |
| --- | --- |
| `index.html` + `script.js` (production) | ported from `HIE Lab Redesign.dc.html` option 2a; data from the new `content.json` + `publications.json` |
| `content.json` (production schema) | rewritten from the repo's `content.json` plus the drafted Speaking and Better Images of AI content |
| `admin.html` | replaces the repo's admin editor; edits the new `content.json` schema generically |
| Redirect stubs | the old repo pages `news/research/team/publications/opportunities.html` |
| `scripts/fetch_publications.py` (v3.0 in this project) | rewritten from the repo's v2.0 — CrossRef dates, title dedupe, date sort |
| `HIE Lab Redesign.dc.html` — 2a What's New stream + Recent years | `publications.json` (copied into the project; fetched at runtime and merged with the hand-written items) |
| `HIE Lab Redesign.dc.html` — 2a lead story image | `assets/images/headlines/FannyMaurel-DigitAmbientScribes-1280x720.png` |
| `HIE Lab Redesign.dc.html` — option 1a "Switchboard" | `content.json` (hero, director, projects, team, news, opportunities, teaching, advisory), `style.css` (palette, fonts), `index.html` (section inventory) |
| `HIE Lab Redesign.dc.html` — option 2a "Switchboard, refined" | `content.json` (all of the above plus `advisory` and `gallery`), `assets/images/advisory/*`, `assets/images/gallery/*` |
| `HIE Lab Redesign.dc.html` — option 1b "Broadsheet" | same as above, plus `assets/images/gallery/*`, `assets/icons/*` |
| Brand assets in `assets/` | `assets/images/logo-*.svg`, `assets/icons/*.svg`, `assets/images/{director,team,gallery,furry}/*` |

## Auto-updating vs. hand-edited
- `publications.json` — refreshed automatically: `.github/workflows/update-publications.yml` runs `scripts/fetch_publications.py` against ORCID weekly (Mondays 06:00 UTC) and commits only on change; `workflow_dispatch` allows a manual run.
- `content.json` — everything else (news, projects, team, advisory, gallery, speaking, opportunities) is hand-edited through `admin.html`: edit, download, commit over the file.
- Contact form delivery — Web3Forms holds the recipient address against the access key. Changing where queries land is done in the Web3Forms account, not in this repo.

## Going live — built, waiting to be committed
Ready in this project, to be committed by Charlene (nothing can be pushed from here): `index.html`, `script.js`, `content.json`, `admin.html`, `CNAME`, `scripts/fetch_publications.py` (v3.0), and the redirect stubs `news / research / team / people / publications / speaking / about / contact / opportunities.html`.

`content.json` is a full replacement, not an append: the production renderer reads its own schema (site, contact, types, panes, feed, projects, past, team, pie, speaking, join, about, themes, affiliations, gallery, art). `publications.json` and `.github/workflows/update-publications.yml` are untouched, so the Monday refresh keeps working. The old `style.css` and the previous multi-page `index.html` are superseded.

Remaining setup, in order: (1) create a free Web3Forms account against charlene.ronquillo@ubc.ca and paste its access key into `contact.accessKey`; (2) commit; (3) Settings → Pages → deploy from `main` / root; (4) point the apex at 185.199.108–111.153 with `www` CNAME to `cronqu.github.io`, then enforce HTTPS; (5) confirm the booking line "Booking from November 2026" is real availability. Eight of the nine Better Images of AI candidates still hotlink their CDN — only *Ambient Scribes* has a local copy, and it is the only one referenced by `content.json`.

## Notes
- The lead-story image in 2a is chosen by keyword match from a catalogue of Better Images of AI works. Only *Ambient Scribes* has a local file; the other eight hotlink their CDN and need downloading into `assets/images/headlines/` before launch. Their library's tag search and filters are client-side only, so candidates have to be added by hand.
- Publications are generated upstream by `.github/workflows/update-publications.yml` into `publications.json`; both designs assume that feed plus `content.json` remain the only things that need editing (via `admin.html`).
- 2a's Speaking pane (fee tiers, modifiers, booking terms) has no upstream source — it is drafted guidance, benchmarked externally, not repo content.
- Every current team member now has a real portrait in 2a; the initials/colour-tile fallback remains in the code for any future photo-less member. Options 1a/1b still use initials for those five.
- Name spelling: `content.json` writes "Dr. Hilal Yildirim" in the name field but "Yıldırım" throughout her bio; the designs use the diacritics.
- `logo-colour-primary.svg` and `logo-colour-badge.svg` had their class→colour maps inferred from the sibling icon files; they are unused in the current designs (the logomark + live Ubuntu text is used instead).
