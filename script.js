/* charleneronquillo.com — Switchboard
   Renders index.html from content.json + publications.json.
   Publications are regenerated weekly by scripts/fetch_publications.py. */

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NORM = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const MON = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const MONTH_OF = d => MONTHS[String(d).slice(0, 3).toUpperCase()] || 0;
const YEAR_OF = f => { const m = String(f.date).match(/(20\d\d)/); return m ? m[1] : ''; };
const MARGIN_RX = /Collaborative|Network|Cluster|Association|Foundation/;
const JOURNAL_OF = (cit, title) => {
  if (!cit) return '';
  const i = cit.indexOf(title);
  let rest = i >= 0 ? cit.slice(i + String(title).length) : cit;
  return rest.replace(/^[.\s]+/, '').split('. ')[0].replace(/\.$/, '').trim();
};

let C = null, PUBS = [], SPLIT = {};
const S = {
  pane: 'stream', filter: 'All', year: 'Recent', q: '',
  palette: false, pq: '', pIdx: 0,
  aud: '', fmt: '', when: '', openKey: null,
  theme: document.documentElement.getAttribute('data-theme') || 'dark'
};

/* ── data shaping ───────────────────────── */
const typeOf = k => (C.types.find(t => t.key === k) || C.types[0]);

function mergedFeed() {
  const seen = {};
  C.feed.forEach(f => { if (f.type === 'Paper') seen[NORM(f.title)] = 1; });
  const extra = [];
  PUBS.forEach(p => {
    const k = NORM(p.title);
    if (seen[k]) return;                       // papers deduplicate against papers only
    seen[k] = 1;
    const url = p.url || ('https://doi.org/' + p.doi);
    const m = Number(p.month) || 0;
    extra.push({ date: (m ? MON[m] + ' ' : '') + p.year, sortM: m, type: 'Paper', title: p.title, venue: p.vancouver_citation || '', href: url, actions: [{ label: 'DOI', href: url }] });
  });
  // Projects are awarded grants: they stay on record even when a paper shares the title,
  // and may legitimately appear more than once alongside the papers they produced.
  return C.feed.concat(extra).sort((a, b) => {
    const ya = Number(YEAR_OF(a)) || 0, yb = Number(YEAR_OF(b)) || 0;
    if (yb !== ya) return yb - ya;
    const ma = a.sortM !== undefined ? a.sortM : MONTH_OF(a.date);
    const mb = b.sortM !== undefined ? b.sortM : MONTH_OF(b.date);
    return mb - ma;
  });
}

function leadPaper() {
  const p = PUBS[0];
  if (!p) {
    const f = C.feed.find(x => x.type === 'Paper') || {};
    return { label: 'Paper · Peer-reviewed · loading the ORCID record', title: f.title || '', citation: f.venue || '', url: f.href || '#' };
  }
  const url = p.url || ('https://doi.org/' + p.doi);
  const journal = JOURNAL_OF(p.vancouver_citation, p.title);
  const m = Number(p.month) || 0;
  return {
    label: 'Paper · Peer-reviewed' + (journal ? ' · ' + journal : '') + ' · ' + ((m ? MONTH_NAMES[m] + ' ' : '') + p.year),
    title: p.title, citation: p.vancouver_citation || '', url
  };
}

const streamItems = () => { const lead = NORM(leadPaper().title); return mergedFeed().filter(f => f.type !== 'Paper' || NORM(f.title) !== lead); };

/* ── project ↔ paper links ──────────────── */
// A "related paper" asserts that a study produced it. Nothing automatic can establish that:
// title keywords match subject matter, and shared-author counts match the standing research
// group, so both attribute a collaborator's other work to whichever grant is nearby. The only
// link shown is an exact title listed by hand in that study's `papers`.
function papersFor(p) {
  const ex = (p.papers || []).map(NORM);
  if (!ex.length) return [];
  return mergedFeed().filter(f => f.type === 'Paper' && ex.indexOf(NORM(f.title)) >= 0);
}
const projectsFor = f => f.type !== 'Paper' ? [] : C.projects.filter(p => (p.papers || []).map(NORM).indexOf(NORM(f.title)) >= 0);
const PAST_CUTOFF = () => new Date().getFullYear() - 4;
const pastRecent = () => C.past.filter(p => Number(p.year) >= PAST_CUTOFF());
const coName = n => (C.coNames && C.coNames[n]) || n;
const scholarHref = n => (C.coLinks && C.coLinks[n]) || ('https://scholar.google.com/scholar?q=' + encodeURIComponent('"' + coName(n) + '"'));
const coLink = n => `<a href="${esc(scholarHref(n))}" target="_blank" rel="noopener" title="Google Scholar — ${esc(coName(n))}">${esc(coName(n))}</a>`;

function decorate(f) {
  const t = typeOf(f.type), s = SPLIT[f.title] || { venue: f.venue, note: '' };
  return Object.assign({}, f, { color: t.color, format: t.format || '', venue: s.venue, note: C.site.marginalia === false ? '' : s.note });
}

const matches = f => {
  if (S.filter !== 'All' && f.type !== S.filter) return false;
  if (S.year !== 'All' && S.year !== 'Recent' && YEAR_OF(f) !== S.year) return false;
  if (!S.q) return true;
  return (f.title + ' ' + f.venue + ' ' + f.type).toLowerCase().includes(S.q.toLowerCase());
};

/* ── chrome ─────────────────────────────── */
function renderChrome(shown) {
  const pane = C.panes.find(p => p.key === S.pane) || C.panes[0];
  const counts = {
    stream: streamItems().length,
    research: C.projects.length + pastRecent().length,
    people: C.team.length + C.pie.length,
    speaking: C.speaking.topics.length,
    join: 3,
    about: C.affiliations.length
  };
  $('#paneTitle').textContent = pane.title;
  $('#paneCount').textContent = S.pane === 'stream' ? shown + ' shown' : counts[S.pane] + ' entries';
  $('#nav').innerHTML = C.panes.map(p => {
    const on = p.key === S.pane;
    return `<button class="navbtn" data-pane="${p.key}"${on ? ' aria-current="true"' : ''}>
      <span class="dot" style="background:${on ? p.color : 'transparent'};align-self:center"></span>
      <span style="font:${on ? "400 18px" : "300 17px"} 'Source Serif 4',serif;color:var(--railfg);opacity:${on ? 1 : .55}">${esc(p.label)}</span>
      <span class="num" style="font:400 10px Ubuntu,sans-serif;letter-spacing:.12em;color:var(--railfg);opacity:.34">${counts[p.key]}</span>
    </button>`;
  }).join('');
  $('#progress').style.height = Math.round((C.panes.findIndex(p => p.key === S.pane) + 1) / C.panes.length * 100) + '%';
  $('#legend').innerHTML = C.types.map(t => `<span style="display:flex;align-items:center;gap:7px;font:400 10px Ubuntu,sans-serif;letter-spacing:.14em;color:var(--muted);text-transform:uppercase"><span class="dot" style="background:${t.color}"></span>${esc(t.key)}</span>`).join('');
  const feed = streamItems().filter(matches);
  $('#spine').innerHTML = C.types.map(t => `<div style="flex:${feed.filter(f => f.type === t.key).length || 0.001};background:${t.color};opacity:.85"></div>`).join('');
}

function renderTheme() {
  const dark = S.theme === 'dark';
  $('#themeLabel').textContent = dark ? 'Dark' : 'Light';
  $('#themeBtn').setAttribute('aria-checked', String(dark));
  $('#themeTrack').style.background = dark ? 'rgba(254,196,21,.22)' : 'transparent';
  $('#themeTrack').style.justifyContent = dark ? 'flex-end' : 'flex-start';
  $('#themeKnob').style.background = dark ? 'var(--yell)' : 'var(--railfg)';
}

/* ── panes ──────────────────────────────── */
function paneStream() {
  const ALL = streamItems(), hits = ALL.filter(matches).map(decorate), rows = S.year === 'Recent' ? hits.slice(0, 7) : hits, lead = leadPaper();
  const art = C.art.find(a => a.title === C.site.headlineImage) || C.art[0];
  const figures = [
    { n: '2021', label: 'Lab founded' },
    { n: String(C.projects.length), label: 'Active studies' },
    { n: String(C.team.length + C.pie.length), label: 'Members and partners' },
    { n: String(C.site.alumniCount || 18), label: 'Alumni since 2021' }
  ];
  const years = (() => { const ys = ALL.map(YEAR_OF).filter(Boolean).map(Number); const hi = ys.length ? Math.max.apply(null, ys) : 2026; return [0, 1, 2, 3, 4].map(i => String(hi - i)); })();

  return `<div data-reveal="1">
  ${C.site.showFigures === false ? '' : `<div style="display:flex;flex-wrap:wrap;gap:52px;padding:36px 0 32px">${figures.map(k => `<div><p class="num serif" style="font:300 38px/1 'Source Serif 4',serif;color:var(--ink);margin:0 0 8px;letter-spacing:-.022em">${esc(k.n)}</p><p class="lab-s">${esc(k.label)}</p></div>`).join('')}</div>`}

  ${C.site.abstractFields === false ? '' : `<div aria-hidden="true" style="height:24px;margin:6px 0 18px;background-image:repeating-linear-gradient(64deg,var(--mark) 0 1px,transparent 1px 6px);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 18%,#000 82%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 18%,#000 82%,transparent 100%);opacity:.7"></div>`}

  <div style="border-top:2px solid var(--teal);padding:26px 0 38px;display:grid;grid-template-columns:1fr 348px;gap:36px;align-items:start">
    <div>
      <p class="lab" style="margin-bottom:14px">${esc(lead.label)}</p>
      <h2 style="margin:0 0 14px;max-width:26ch"><a href="${esc(lead.url)}" style="font:400 36px/1.16 'Source Serif 4',serif;color:var(--ink);letter-spacing:-.018em;text-wrap:pretty;display:block;hanging-punctuation:first">${esc(lead.title)}</a></h2>
      <p style="font:300 12.5px/1.7 Ubuntu,sans-serif;color:var(--muted);margin:0 0 20px;max-width:76ch">${esc(lead.citation)}</p>
      <div style="display:flex;gap:26px"><a href="${esc(lead.url)}" class="btn" style="border-color:var(--ink)">Read the paper</a></div>
    </div>
    <figure style="margin:0">
      <div role="img" aria-label="${esc(art.alt)}" style="width:100%;aspect-ratio:${esc(art.ar || '4/3')};background-color:var(--tile);background-image:url('${esc(art.local)}');background-size:cover;background-position:center"></div>
      <figcaption style="font:300 11px/1.6 Ubuntu,sans-serif;color:var(--muted);margin:9px 0 0"><a href="${esc(art.artistHref)}" style="color:var(--muted);border-bottom:1px solid var(--line2)">${esc(art.artist)}</a>${art.coName ? ` &amp; <a href="${esc(art.coHref)}" style="color:var(--muted);border-bottom:1px solid var(--line2)">${esc(art.coName)}</a>` : ''} / <a href="${esc(art.pageHref)}" style="color:var(--muted);border-bottom:1px solid var(--line2)"><i>${esc(art.title)}</i></a> / <a href="https://creativecommons.org/licenses/by/4.0/" style="color:var(--muted);border-bottom:1px solid var(--line2)">Licenced by CC-BY 4.0</a></figcaption>
    </figure>
  </div>

  <div style="border-top:1px solid var(--line);padding:26px 0 6px">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px">
      <p class="hd" style="margin:0">Recent years</p>
      <button class="ghost" data-year="All" style="color:${S.year === 'All' ? 'var(--ink)' : 'var(--muted)'};border-color:${S.year === 'All' ? 'var(--yell)' : 'transparent'}">All years</button>
    </div>
    <div style="display:flex;gap:8px;align-items:flex-end">
      ${years.map(y => { const items = ALL.filter(f => YEAR_OF(f) === y), on = S.year === y;
        return `<button class="ybtn" data-year="${y}" data-on="${on ? 1 : 0}" aria-label="${items.length} items in ${y}" style="all:unset;cursor:pointer;flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;height:74px;padding-bottom:6px;border-bottom:1px solid ${on ? 'var(--ink)' : 'var(--line2)'}">${items.slice(0, 9).map(f => `<span class="ybar" style="width:100%;height:5px;--c:${typeOf(f.type).color}"></span>`).join('')}</button>`; }).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:7px">
      ${years.map(y => `<span class="num" style="flex:1;display:flex;align-items:baseline;gap:7px;font:400 10px Ubuntu,sans-serif;letter-spacing:.1em;color:${S.year === y ? 'var(--ink)' : 'var(--muted)'}">${y}<span style="font:300 9.5px Ubuntu,sans-serif;color:var(--muted)">${ALL.filter(f => YEAR_OF(f) === y).length}</span></span>`).join('')}
    </div>
  </div>

  <div style="position:sticky;top:0;background:var(--surface);padding:18px 0 16px;display:flex;flex-wrap:wrap;gap:22px;align-items:center;z-index:5;border-top:1px solid var(--line);margin-top:34px">
    <input id="q" class="field" value="${esc(S.q)}" placeholder="Search titles, journals, people…" aria-label="Search the stream" style="flex:1;min-width:200px;font:300 13.5px Ubuntu,sans-serif;width:auto">
    <div style="display:flex;flex-wrap:wrap;gap:16px">
      ${[{ key: 'All', color: 'var(--muted)' }].concat(C.types).map(t => { const on = S.filter === t.key;
        return `<button data-filter="${esc(t.key)}" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;font:500 10px Ubuntu,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${on ? 'var(--ink)' : 'var(--muted)'};padding-bottom:3px;border-bottom:1px solid ${on ? 'var(--ink)' : 'transparent'}"><span class="dot" style="width:6px;height:6px;background:${t.color}"></span>${esc(t.key)}</button>`; }).join('')}
    </div>
  </div>

  ${rows.map(f => { const tags = projectsFor(f);
    return `<div class="row" style="display:grid;grid-template-columns:76px 1fr 124px;gap:18px;padding:13px 12px;margin:0 -12px;border-top:1px solid var(--hair);align-items:start">
    <p class="num" style="font:400 9.5px Ubuntu,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);margin:4px 0 0">${esc(f.date)}</p>
    <div style="min-width:0">
      <p style="display:flex;align-items:center;gap:6px;font:500 8.5px Ubuntu,sans-serif;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);margin:0 0 5px"><span class="dot" style="width:6px;height:6px;background:${f.color}"></span>${esc(f.type)}${f.format ? `<span style="color:var(--line2)">·</span>${esc(f.format)}` : ''}</p>
      <a href="${esc(f.href)}" style="font:400 15.5px/1.4 'Source Serif 4',serif;color:var(--ink);display:block;max-width:66ch;hanging-punctuation:first last;text-wrap:pretty">${esc(f.title)}</a>
      <p style="font:300 11.5px/1.55 Ubuntu,sans-serif;color:var(--muted);margin:4px 0 0;max-width:74ch">${esc(f.venue)}</p>
      ${tags.length || (f.actions || []).length ? `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:7px 14px;margin-top:8px">
        ${tags.map(p => `<button class="chip" data-proj="${esc(p.short)}" title="Open this study on the Research page" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:5px;font:500 8.5px Ubuntu,sans-serif;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);padding:2px 8px"><span class="dot" style="width:5px;height:5px;background:${p.color}"></span>${esc(p.short)}</button>`).join('')}
        ${(f.actions || []).map(a => `<a class="link" style="font-size:8.5px" href="${esc(a.href)}">${esc(a.label)}</a>`).join('')}
      </div>` : ''}
    </div>
    <p style="font:400 11px/1.5 'Source Serif 4',serif;font-style:italic;color:var(--muted);margin:3px 0 0;text-align:right">${esc(f.note)}</p>
  </div>`; }).join('')}

  ${rows.length ? '' : `<div style="border-top:1px solid var(--hair);padding:34px 0 8px;max-width:52ch">
    <p style="font:400 20px/1.5 'Source Serif 4',serif;color:var(--ink);margin:0 0 10px">Nothing here under those filters.</p>
    <p style="font:300 13.5px/1.7 Ubuntu,sans-serif;margin:0 0 14px">The stream carries recent items; the publication list is generated from the ORCID record every Monday.</p>
    <button class="btn" id="reset">Clear the filters</button></div>`}

  <p class="num" style="font:300 11.5px Ubuntu,sans-serif;letter-spacing:.06em;color:var(--muted);margin:22px 0 0;border-top:1px solid var(--hair);padding-top:16px">${S.year === 'Recent' ? `the ${rows.length} most recent of ${ALL.length} items · <button class="ghost" data-year="All" style="color:var(--ink);border-color:var(--yell)">All years</button>` : S.year === 'All' ? `all ${ALL.length} items` : `all ${rows.length} items from ${S.year}`} · papers come from the ORCID record, refreshed every Monday morning</p>

</div>`;
}

function relatedPapers(list, key) {
  const open = S.openKey === key;
  if (!list.length) return `<p style="font:300 11px Ubuntu,sans-serif;letter-spacing:.05em;color:var(--muted);margin:12px 0 0">No papers linked yet.</p>`;  return `<div style="margin-top:14px">
    <button class="acc" data-acc="${esc(key)}" aria-expanded="${open}">${open ? '−' : '+'} ${list.length} paper${list.length > 1 ? 's' : ''} from this study</button>
    ${open ? `<div style="margin-top:14px;display:flex;flex-direction:column;gap:14px;border-left:2px solid var(--yell);padding-left:16px">
      ${list.map(f => `<div>
        <a href="${esc(f.href)}" style="font:400 14.5px/1.4 'Source Serif 4',serif;color:var(--ink);display:block;max-width:62ch;text-wrap:pretty">${esc(f.title)}</a>
        <p style="font:300 11px/1.55 Ubuntu,sans-serif;color:var(--muted);margin:3px 0 0;max-width:70ch">${esc(f.date)}${f.venue ? ' · ' + esc(f.venue) : ''}</p>
      </div>`).join('')}
    </div>` : ''}
  </div>`;
}

const OUT_ICON = { Presentation: 'var(--pink)', Video: 'var(--pink)', Poster: 'var(--yell)', Report: 'var(--teal)', 'Plain language': 'var(--lav)' };

function otherOutputs(list, key) {
  if (!list || !list.length) return '';
  const open = S.openKey === key;
  return `<div style="margin-top:10px">
    <button class="acc" data-acc="${esc(key)}" aria-expanded="${open}">${open ? '−' : '+'} ${list.length} other knowledge output${list.length > 1 ? 's' : ''}</button>
    ${open ? `<div style="margin-top:14px;display:flex;flex-direction:column;gap:13px;border-left:2px solid var(--lav);padding-left:16px">
      ${list.map(o => `<div>
        <p style="display:flex;align-items:center;gap:6px;font:500 8.5px Ubuntu,sans-serif;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);margin:0 0 4px"><span class="dot" style="width:5px;height:5px;background:${OUT_ICON[o.kind] || 'var(--lav)'}"></span>${esc(o.kind || 'Output')}</p>
        ${o.href ? `<a href="${esc(o.href)}" style="font:400 14.5px/1.4 'Source Serif 4',serif;color:var(--ink);display:block;max-width:62ch;text-wrap:pretty">${esc(o.title)}</a>` : `<p style="font:400 14.5px/1.4 'Source Serif 4',serif;color:var(--ink);margin:0;max-width:62ch;text-wrap:pretty">${esc(o.title)}</p>`}
        ${o.note ? `<p style="font:300 11px/1.55 Ubuntu,sans-serif;color:var(--muted);margin:3px 0 0;max-width:70ch">${esc(o.note)}</p>` : ''}
      </div>`).join('')}
    </div>` : ''}
  </div>`;
}

function paneResearch() {
  const collab = (() => {
    const m = {};
    C.projects.forEach(p => String(p.co).split(', ').forEach(n => { m[n] = (m[n] || 0) + 1; }));
    return Object.keys(m).sort((a, b) => m[b] - m[a] || a.localeCompare(b)).map(n => ({ name: n, dot: m[n] > 1 ? 'var(--lav)' : 'transparent' }));
  })();
  return `<div data-reveal="1" style="padding-top:30px">
  ${C.site.abstractFields === false ? '' : `<div aria-hidden="true" style="position:relative;height:146px;margin-bottom:26px"><div style="position:absolute;inset:0;background-image:radial-gradient(circle at center,var(--mark) 1.1px,transparent 1.4px);background-size:13px 13px;-webkit-mask-image:radial-gradient(38% 122% at 66% 44%,transparent 0 32%,#000 62%);mask-image:radial-gradient(38% 122% at 66% 44%,transparent 0 32%,#000 62%)"></div><span style="position:absolute;left:66%;top:44%;width:8px;height:8px;border-radius:50%;background:var(--lav);transform:translate(-50%,-50%)"></span></div>`}
  <p class="quote" style="font-size:19px;max-width:56ch;margin-bottom:30px">${esc(C.about.researchQuote)}</p>
  ${C.projects.map(p => `<div style="border-top:1px solid var(--line);padding:24px 0 28px;display:grid;grid-template-columns:150px 1fr;gap:26px">
    <div>
      <p style="display:flex;align-items:center;gap:7px;font:500 9.5px Ubuntu,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);margin:0 0 8px"><span class="dot" style="background:${p.color}"></span>${esc(p.status)}</p>
      <p style="font:300 11px/1.55 Ubuntu,sans-serif;color:var(--muted);margin:0">${esc(p.funding)}</p>
    </div>
    <div id="proj-${esc(p.short).replace(/[^A-Za-z0-9]+/g, '-')}">
      <h3 style="font:400 22px/1.32 'Source Serif 4',serif;color:var(--ink);margin:0 0 10px;max-width:56ch;text-wrap:pretty">${esc(p.title)}</h3>
      <p style="font:300 14px/1.7 Ubuntu,sans-serif;margin:0 0 10px;max-width:70ch">${esc(p.description)}</p>
      <p style="font:300 11px/1.7 Ubuntu,sans-serif;letter-spacing:.05em;color:var(--muted);margin:0">With ${String(p.co).split(', ').map(n => coLink(n.trim())).join(', ')}</p>
      ${relatedPapers(papersFor(p), 'p:' + p.short)}
      ${otherOutputs(p.outputs, 'o:' + p.short)}
    </div></div>`).join('')}
  <div style="margin:38px 0 16px;border-top:1px solid var(--line);padding-top:20px;display:flex;flex-wrap:wrap;align-items:baseline;gap:16px">
    <h3 class="hd" style="margin:0">Earlier work</h3>
    <p style="font:300 11.5px Ubuntu,sans-serif;letter-spacing:.06em;color:var(--muted);margin:0">Studies from ${PAST_CUTOFF()} onward. The full record is in the ORCID list.</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:26px 44px">
    ${pastRecent().map((p, i) => `<div style="break-inside:avoid">
      <p style="font:400 14.5px/1.5 'Source Serif 4',serif;color:var(--ink);margin:0 0 5px;max-width:44ch;text-wrap:pretty">${esc(p.title)}</p>
      <p style="font:300 10.5px Ubuntu,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0">${esc(p.year)}${p.funding ? ' · ' + esc(p.funding) : ''}</p>
      ${relatedPapers(papersFor(p), 'past:' + i)}
      ${otherOutputs(p.outputs, 'opast:' + i)}
    </div>`).join('')}
  </div>
  <div style="margin-top:14px;padding-top:18px;border-top:1px solid var(--line)">
    <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:16px;margin-bottom:14px">
      <h3 class="hd" style="margin:0">Co-investigators</h3>
      <p style="font:300 11.5px Ubuntu,sans-serif;letter-spacing:.06em;color:var(--muted);margin:0">Across the four active studies. A filled mark means more than one shared study. Each name links to their Google Scholar.</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px 22px">
      ${collab.map(c => `<p style="display:flex;align-items:center;gap:7px;font:400 14.5px 'Source Serif 4',serif;color:var(--ink);margin:0"><span class="dot" style="width:6px;height:6px;background:${c.dot};box-shadow:inset 0 0 0 1px var(--lav)"></span>${coLink(c.name)}</p>`).join('')}
    </div>
  </div>
  <p style="font:300 11.5px/1.7 Ubuntu,sans-serif;color:var(--muted);margin:34px 0 0;padding-top:18px;border-top:1px solid var(--line);max-width:78ch">${esc(C.about.funders)}</p>
</div>`;
}

function panePeople() {
  return `<div data-reveal="1" style="padding-top:30px">
  ${C.site.abstractFields === false ? '' : `<div aria-hidden="true" style="position:relative;height:132px;margin-bottom:24px"><div style="position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,var(--mark) 0 1px,transparent 1px 14px),repeating-linear-gradient(90deg,var(--mark) 0 1px,transparent 1px 14px);-webkit-mask-image:radial-gradient(52% 128% at 34% 52%,#000 0 30%,transparent 74%);mask-image:radial-gradient(52% 128% at 34% 52%,#000 0 30%,transparent 74%)"></div><span style="position:absolute;left:34%;top:52%;width:9px;height:9px;border-radius:50%;background:var(--lav);transform:translate(-50%,-50%)"></span></div>`}
  <p class="quote" style="margin-bottom:32px">${esc(C.about.peopleQuote)}</p>
  <div style="border-top:1px solid var(--line);padding:16px 0 26px;margin-bottom:34px">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
      <p class="hd" style="margin:0">From the lab</p>
      <div style="display:flex;gap:14px">
        <button id="gprev" aria-label="Scroll gallery left" class="ghost" style="font:400 15px 'Source Serif 4',serif;border:none">←</button>
        <button id="gnext" aria-label="Scroll gallery right" class="ghost" style="font:400 15px 'Source Serif 4',serif;border:none">→</button>
      </div>
    </div>
    <div id="gallery" class="pane" style="display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px">
      ${C.gallery.map(g => `<figure style="margin:0;flex:none;width:${g.w}px;scroll-snap-align:start">
        <div role="img" aria-label="${esc(g.cap)}" style="width:100%;aspect-ratio:4/3;background-color:var(--tile);background-image:url('${esc(g.src)}');background-size:cover;background-position:center"></div>
        <figcaption style="font:300 11px/1.55 Ubuntu,sans-serif;color:var(--muted);margin:8px 0 0">${esc(g.cap)}</figcaption></figure>`).join('')}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:24px 20px;align-items:start">
    ${C.team.map((m, i) => { const open = S.openKey === 'bio:' + i, has = !!String(m.bio || '').trim();
      return `<div style="${open ? 'grid-column:1/-1;display:grid;grid-template-columns:96px 1fr;gap:20px;align-items:start;border-top:1px solid var(--line);padding-top:14px' : ''}">
      <button class="pht" data-bio="${i}" data-has="${has ? 1 : 0}" ${has ? `aria-expanded="${open}" title="${open ? 'Hide' : 'Read'} ${esc(m.name)}’s bio"` : 'disabled style="cursor:default"'}>
        <span role="img" aria-label="${esc(m.name)}" style="display:block;width:96px;aspect-ratio:1;background-color:var(--tile);background-image:url('${esc(m.photo)}');background-size:cover;background-position:center top"></span>
      </button>
      <div>
        <p style="font:400 14.5px/1.3 'Source Serif 4',serif;color:var(--ink);margin:${open ? '0' : '10px'} 0 3px">${esc(m.name)}</p>
        <p style="font:300 10.5px/1.45 Ubuntu,sans-serif;letter-spacing:.05em;color:var(--muted);margin:0">${esc(m.role)}</p>
        ${open ? `<p style="font:300 12.5px/1.7 Ubuntu,sans-serif;margin:12px 0 0;max-width:74ch">${esc(m.bio)}</p>
        <button class="acc" data-bio="${i}" style="margin-top:12px">− Close</button>` : ''}
      </div></div>`; }).join('')}
  </div>
  <div style="margin-top:34px;padding-top:20px;border-top:1px solid var(--line)">
    <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:16px;margin-bottom:6px">
      <h3 style="font:400 22px 'Source Serif 4',serif;color:var(--ink);margin:0">HIE PIE Advisory</h3>
      <p style="font:300 11px Ubuntu,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0">Patient and provider partners</p>
    </div>
    <p style="font:300 14px/1.75 Ubuntu,sans-serif;margin:0 0 22px;max-width:76ch">${esc(C.pieIntro)}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px 34px">
      ${C.pie.map(p => `<div style="display:grid;grid-template-columns:96px 1fr;gap:18px;border-top:1px solid var(--line);padding-top:14px;align-items:start">
        <div role="img" aria-label="${esc(p.name)}" style="width:96px;aspect-ratio:1;background-color:var(--tile);background-image:url('${esc(p.photo)}');background-size:cover;background-position:center top"></div>
        <div>
          <p style="display:flex;align-items:center;gap:7px;font:500 9.5px Ubuntu,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:0 0 6px"><span class="dot" style="background:${p.color}"></span>${esc(p.role)}</p>
          <p style="font:400 17px/1.3 'Source Serif 4',serif;color:var(--ink);margin:0 0 6px">${esc(p.name)}</p>
          <p style="font:300 12.5px/1.65 Ubuntu,sans-serif;margin:0">${esc(p.focus)}</p>
        </div></div>`).join('')}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:150px 1fr;gap:26px;margin-top:32px;padding-top:24px;border-top:1px solid var(--line);align-items:start">
    <img src="${esc(C.maya.photo)}" alt="Maya" style="width:100%;aspect-ratio:4/5;object-fit:cover">
    <div>
      <p style="display:flex;align-items:center;gap:7px;font:500 9.5px Ubuntu,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:0 0 10px"><span class="dot" style="background:var(--pink)"></span>The actual PI</p>
      <h3 style="font:400 22px 'Source Serif 4',serif;color:var(--ink);margin:0 0 8px">${esc(C.maya.name)}</h3>
      <p style="font:300 14px/1.7 Ubuntu,sans-serif;margin:0;max-width:64ch"><b style="font-weight:500;color:var(--ink)">Likes</b> ${esc(C.maya.likes)} <b style="font-weight:500;color:var(--ink)">Dislikes</b> ${esc(C.maya.dislikes)}</p>
      <p style="font:300 13.5px/1.7 Ubuntu,sans-serif;margin:18px 0 0;max-width:70ch">${esc(C.maya.alumni)}</p>
    </div>
  </div>
</div>`;
}

function paneSpeaking() {
  const sp = C.speaking, tierIdx = sp.audiences.indexOf(S.aud);
  const estimate = tierIdx < 0
    ? 'Pick an audience and the matching band lights up above.'
    : (tierIdx === 0
      ? 'No honorarium — community and patient-led work is unpaid by design. Travel covered if it is in person.'
      : sp.tiers[tierIdx].fee + (S.fmt ? ' · ' + S.fmt.toLowerCase() : '') + (S.when ? ' · ' + S.when.toLowerCase() : '') + '. I will send a figure by return email; travel is extra for in-person work.');
  const sel = (id, val, list, label) => `<label style="display:block"><span class="flabel">${label}</span>
    <select class="field" data-sel="${id}"><option value="">Choose one</option>${list.map(o => `<option value="${esc(o)}"${val === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;

  return `<div data-reveal="1" style="padding-top:30px">
  <div style="display:grid;grid-template-columns:1fr 300px;gap:38px;align-items:end;margin-bottom:26px">
    <p class="quote" style="font-size:20px;margin:0;max-width:56ch">${esc(sp.intro)}</p>
    <div>
      <div aria-hidden="true" style="display:flex;gap:5px;align-items:flex-end;height:96px">
        <div style="flex:1;height:38%;background-image:repeating-linear-gradient(0deg,var(--teal) 0 1px,transparent 1px 7px)"></div>
        <div style="flex:1;height:58%;background-image:repeating-linear-gradient(0deg,var(--yell) 0 1px,transparent 1px 6px)"></div>
        <div style="flex:1;height:78%;background-image:repeating-linear-gradient(0deg,var(--pink) 0 1px,transparent 1px 5px)"></div>
        <div style="flex:1;height:100%;background-image:repeating-linear-gradient(0deg,var(--lav) 0 1px,transparent 1px 4px)"></div>
      </div>
    </div>
  </div>

  <h3 class="hd" style="border-top:1px solid var(--line);padding-top:16px;margin-bottom:12px">Topics</h3>
  <div style="display:flex;flex-wrap:wrap;gap:10px 26px;margin-bottom:30px">
    ${sp.topics.map(t => `<p style="font:400 15px 'Source Serif 4',serif;color:var(--ink);margin:0">${esc(t)}</p>`).join('')}
  </div>

  <h3 class="hd" style="border-top:1px solid var(--line);padding-top:16px;margin-bottom:4px">Sliding scale</h3>
  <p style="font:300 13.5px/1.7 Ubuntu,sans-serif;margin:0 0 18px;max-width:78ch">${esc(sp.scaleNote)}</p>
  ${sp.tiers.map((t, i) => `<div style="display:grid;grid-template-columns:190px 1fr 200px;gap:26px;padding:18px 14px;margin:0 -14px;border-top:1px solid var(--hair);align-items:start;background:${i === tierIdx ? 'var(--tile)' : 'transparent'}">
    <p style="display:flex;align-items:baseline;gap:8px;font:400 16px/1.35 'Source Serif 4',serif;color:var(--ink);margin:0"><span class="dot" style="background:${t.color};transform:translateY(-3px)"></span>${esc(t.tier)}</p>
    <div>
      <p style="font:300 13.5px/1.7 Ubuntu,sans-serif;margin:0 0 6px;max-width:60ch">${esc(t.who)}</p>
      <p class="num" style="font:300 12.5px/1.65 Ubuntu,sans-serif;color:var(--muted);margin:0;max-width:60ch">${esc(t.detail)}</p>
    </div>
    <p class="num" style="font:400 19px 'Source Serif 4',serif;color:var(--ink);margin:0;text-align:right">${esc(t.fee)}</p>
  </div>`).join('')}

  <div style="margin-top:30px;border-top:2px solid var(--yell);padding-top:18px">
    <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:16px;margin-bottom:16px">
      <h3 style="font:400 20px 'Source Serif 4',serif;color:var(--ink);margin:0">Tell me about the event</h3>
      <p style="font:300 12.5px Ubuntu,sans-serif;color:var(--muted);margin:0">Three answers and the form fills itself in.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:26px">
      ${sel('aud', S.aud, sp.audiences, 'Who is asking')}
      ${sel('fmt', S.fmt, sp.formats, 'Format')}
      ${sel('when', S.when, sp.timings, 'When')}
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:30px;margin-top:20px;padding-top:14px;border-top:1px solid var(--line)">
      <p class="num" style="font:400 17px/1.5 'Source Serif 4',serif;color:var(--ink);margin:0;max-width:62ch">${esc(estimate)}</p>
      <button class="btn" data-ask="Speaking invitation">Send the inquiry →</button>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:34px;margin-top:30px">
    ${sp.notes.map(n => `<div style="border-top:1px solid var(--line2);padding-top:16px">
      <h3 style="font:400 18px 'Source Serif 4',serif;color:var(--ink);margin:0 0 12px">${esc(n.head)}</h3>
      <p style="font:300 13px/1.75 Ubuntu,sans-serif;margin:0">${esc(n.body)}</p></div>`).join('')}
  </div>
</div>`;
}

function paneJoin() {
  const j = C.join;
  return `<div data-reveal="1" style="padding-top:30px">
  ${C.site.abstractFields === false ? '' : `<div aria-hidden="true" style="height:128px;margin-bottom:24px;background-image:repeating-linear-gradient(74deg,var(--mark) 0 1px,transparent 1px 11px),repeating-linear-gradient(-74deg,var(--mark) 0 1px,transparent 1px 11px);-webkit-mask-image:radial-gradient(66% 150% at 28% 50%,#000 0 38%,transparent 80%);mask-image:radial-gradient(66% 150% at 28% 50%,#000 0 38%,transparent 80%)"></div>`}
  <div style="border-top:2px solid var(--yell);padding-top:16px;margin-bottom:30px">
    <p class="lab-s" style="letter-spacing:.22em;margin-bottom:10px">${esc(j.openLabel)}</p>
    <h2 style="font:400 30px/1.28 'Source Serif 4',serif;color:var(--ink);margin:0;max-width:34ch">${esc(j.openHead)}</h2>
  </div>
  <p style="font:300 15px/1.75 Ubuntu,sans-serif;margin:0 0 32px;max-width:72ch">${esc(j.body)}</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:34px">
    ${j.columns.map(c => `<div style="border-top:1px solid var(--line2);padding-top:16px">
      <h3 style="font:400 19px 'Source Serif 4',serif;color:var(--ink);margin:0 0 12px">${esc(c.head)}</h3>
      <p style="font:300 13.5px/1.75 Ubuntu,sans-serif;margin:0">${esc(c.body)}</p>
      ${c.foot ? `<p style="font:300 10.5px Ubuntu,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:14px 0 0">${esc(c.foot)}</p>` : ''}</div>`).join('')}
  </div>
  ${(j.notes || []).length ? `<div style="margin-top:38px;border-top:1px solid var(--line);padding-top:22px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:26px 40px">
    ${j.notes.map(n => `<div>
      <p style="font:500 9.5px Ubuntu,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:0 0 8px">${esc(n.head)}</p>
      <p style="font:300 13.5px/1.75 Ubuntu,sans-serif;margin:0;max-width:64ch">${esc(n.body)}</p></div>`).join('')}
  </div>` : ''}
  <div style="margin-top:30px;border-top:2px solid var(--yell);padding-top:18px;display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:24px">
    <p style="font:400 17px/1.5 'Source Serif 4',serif;color:var(--ink);margin:0;max-width:60ch">Send the query through the form and it comes straight to me — no address to copy down.</p>
    <button class="btn" data-ask="Supervision or student inquiry">Send a query →</button>
  </div>
</div>`;
}

function paneAbout() {
  const a = C.about;
  return `<div data-reveal="1" style="padding-top:30px;display:grid;grid-template-columns:250px 1fr;gap:38px;align-items:start">
  <div>
    <img src="${esc(a.photo)}" alt="Charlene E. Ronquillo" style="width:100%;aspect-ratio:3/4;object-fit:cover">
    <p style="font:300 11.5px/1.7 Ubuntu,sans-serif;color:var(--muted);margin:12px 0 0">${esc(C.site.address).replace(/\n/g, '<br>')}</p>
    ${C.site.abstractFields === false ? '' : `<div aria-hidden="true" style="height:170px;margin-top:18px;background-image:repeating-radial-gradient(circle at 18% 116%,transparent 0 12px,var(--mark) 12px 13px);-webkit-mask-image:linear-gradient(178deg,#000 0 52%,transparent 96%);mask-image:linear-gradient(178deg,#000 0 52%,transparent 96%)"></div>`}
  </div>
  <div>
    <p style="font:400 10px Ubuntu,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:0 0 16px">${esc(a.kicker)}</p>
    <p style="font:400 20px/1.62 'Source Serif 4',serif;color:var(--ink);margin:0 0 16px;max-width:58ch;text-wrap:pretty">${esc(a.lead)}</p>
    <p style="font:300 14.5px/1.75 Ubuntu,sans-serif;margin:0 0 28px;max-width:72ch">${esc(a.body)}</p>
    <h3 class="hd" style="border-top:1px solid var(--line);padding-top:16px">What we work on</h3>
    <div style="display:flex;flex-wrap:wrap;gap:16px 14px;margin-bottom:30px">
      ${C.themes.map(t => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:74px">
        <div role="img" aria-label="${esc(t.label)}" style="width:40px;height:40px;background-image:url('${esc(t.src)}');background-size:contain;background-repeat:no-repeat;background-position:center"></div>
        <span style="font:300 10.5px/1.35 Ubuntu,sans-serif;letter-spacing:.04em;color:var(--muted);text-align:center">${esc(t.label)}</span></div>`).join('')}
    </div>
    <h3 class="hd" style="border-top:1px solid var(--line);padding-top:16px;margin-bottom:10px">Also</h3>
    ${C.affiliations.map(x => `<div style="display:grid;grid-template-columns:210px 1fr;gap:18px;padding:9px 0;border-bottom:1px solid var(--hair)">
      <span style="font:300 10.5px Ubuntu,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-top:3px">${esc(x.role)}</span>
      <a href="${esc(x.url)}" style="font:400 15px 'Source Serif 4',serif">${esc(x.org)}</a></div>`).join('')}
  </div>
</div>`;
}

const PANE_FNS = { stream: paneStream, research: paneResearch, people: panePeople, speaking: paneSpeaking, join: paneJoin, about: paneAbout };

function externalize(root) {
  if (!root) return;
  root.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href') || '';
    if (/^(https?:)?\/\//i.test(h)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });
}

function render() {
  const html = (PANE_FNS[S.pane] || paneStream)();
  $('#pane').innerHTML = html;
  externalize($('#pane'));
  renderChrome(streamItems().filter(matches).length);
  renderTheme();
  const q = $('#q');
  if (q && S.focusQ) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  S.focusQ = false;
}

function goPane(k, scroll) {
  S.pane = k;
  closePalette();
  try { history.replaceState(null, '', '#/' + k); } catch (e) {}
  render();
  if (scroll !== false) $('#pane').scrollTop = 0;
}

/* ── command palette ────────────────────── */
function paletteItems() {
  const items = [];
  C.panes.forEach(p => items.push({ group: 'Section', label: p.label, sub: 'Open the ' + p.label.toLowerCase() + ' pane', act: () => goPane(p.key) }));
  mergedFeed().forEach(f => items.push({ group: f.type, label: f.title, sub: f.venue, act: () => { if (String(f.href).indexOf('http') === 0) { window.open(f.href, '_blank', 'noopener'); closePalette(); } else goPane('stream'); } }));
  C.projects.forEach(p => items.push({ group: 'Study', label: p.short, sub: p.funding, act: () => goPane('research') }));
  C.team.forEach(m => items.push({ group: 'Lab', label: m.name, sub: m.role, act: () => goPane('people') }));
  C.pie.forEach(p => items.push({ group: 'Advisory', label: p.name, sub: p.role + ' · HIE PIE', act: () => goPane('people') }));
  C.speaking.topics.forEach(t => items.push({ group: 'Speaking', label: t, sub: 'Talk topic', act: () => goPane('speaking') }));
  C.affiliations.forEach(a => items.push({ group: 'Also', label: a.org, sub: a.role, act: () => goPane('about') }));
  items.push({ group: 'Contact', label: 'Send a query', sub: 'Opens the query form', act: () => openAsk('') });
  const q = S.pq.trim().toLowerCase();
  const hit = q ? items.filter(i => (i.label + ' ' + i.sub + ' ' + i.group).toLowerCase().includes(q)) : items.slice(0, 6);
  return hit.slice(0, 8);
}

function renderPalette() {
  const box = $('#palette');
  if (!S.palette) { box.hidden = true; box.innerHTML = ''; return; }
  const hits = paletteItems();
  box.hidden = false;
  box.innerHTML = `<div class="card" style="max-height:620px" role="dialog" aria-label="Search">
    <div style="display:flex;align-items:center;gap:16px;padding:17px 22px;border-bottom:1px solid var(--line)">
      <span class="lab-s" style="letter-spacing:.2em;flex:none">Go to</span>
      <input id="pq" value="${esc(S.pq)}" aria-label="Search papers, people, studies and sections" placeholder="Papers, people, studies, sections…" style="flex:1;min-width:0;font:300 17px 'Source Serif 4',serif;color:var(--ink);background:transparent;border:none;outline:none">
      <button class="ghost" id="pesc" style="flex:none">Esc</button>
    </div>
    <div class="pane" style="overflow-y:auto">
      ${hits.map((h, i) => `<button class="hit" data-hit="${i}" data-on="${i === S.pIdx ? 1 : 0}">
        <span style="font:500 9px Ubuntu,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)">${esc(h.group)}</span>
        <span style="display:block;min-width:0">
          <span style="font:400 15px/1.4 'Source Serif 4',serif;color:var(--ink);display:block">${esc(h.label)}</span>
          <span style="font:300 11.5px/1.5 Ubuntu,sans-serif;color:var(--muted);display:block;margin-top:2px">${esc(h.sub)}</span>
        </span></button>`).join('')}
      <p style="font:300 12px/1.6 Ubuntu,sans-serif;color:var(--muted);margin:0;padding:15px 22px;border-top:1px solid var(--hair)">${S.pq ? hits.length + ' matches · ↑↓ to move, return to open' : 'Type to search papers, people, studies, sections and networks'}</p>
    </div></div>`;
  const inp = $('#pq');
  inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
}
const closePalette = () => { if (S.palette) { S.palette = false; renderPalette(); } };

/* ── query form ─────────────────────────── */
function openAsk(subject) {
  const c = C.contact, sp = C.speaking;
  const detail = [S.aud && 'Who is asking: ' + S.aud, S.fmt && 'Format: ' + S.fmt, S.when && 'When: ' + S.when].filter(Boolean).join(' · ');
  const chosen = subject || (S.aud || S.fmt || S.when ? 'Speaking invitation' : '');
  closePalette();
  const box = $('#dialog');
  box.hidden = false;
  box.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-label="Send a query" style="width:660px">
    <form id="askForm" novalidate style="display:flex;flex-direction:column">
      <div style="display:flex;align-items:baseline;gap:16px;padding:20px 26px 16px;border-bottom:1px solid var(--line)">
        <h2 style="font:400 22px 'Source Serif 4',serif;color:var(--ink);margin:0">Send a query</h2>
        <p style="font:300 12px Ubuntu,sans-serif;color:var(--muted);margin:0;flex:1">Goes straight to the lab inbox.</p>
        <button type="button" class="ghost" id="askEsc">Esc</button>
      </div>
      <div style="padding:22px 26px;display:grid;gap:20px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <label style="display:block"><span class="flabel">Your name</span><input class="field" name="name" required autocomplete="name"></label>
          <label style="display:block"><span class="flabel">Your email</span><input class="field" name="email" type="email" required autocomplete="email"></label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <label style="display:block"><span class="flabel">Organisation <span style="text-transform:none;letter-spacing:0">(optional)</span></span><input class="field" name="organisation" autocomplete="organization"></label>
          <label style="display:block"><span class="flabel">What is this about</span>
            <select class="field" name="topic" required>${['<option value="">Choose one</option>'].concat(c.subjects.map(s => `<option value="${esc(s)}"${s === chosen ? ' selected' : ''}>${esc(s)}</option>`)).join('')}</select></label>
        </div>
        ${detail ? `<p class="num" style="font:300 12px/1.6 Ubuntu,sans-serif;color:var(--muted);margin:0;border-left:2px solid var(--yell);padding-left:12px">Included from the speaking pane — ${esc(detail)}</p>` : ''}
        <label style="display:block"><span class="flabel">Your message</span><textarea class="field" name="message" required placeholder="Dates, audience, what you are hoping for — as much or as little as you like."></textarea></label>
        <div>
          <span class="flabel">Attach a PDF <span style="text-transform:none;letter-spacing:0">(optional)</span></span>
          <input class="field" type="file" name="attachment" accept="application/pdf,.pdf" style="font:300 12.5px Ubuntu,sans-serif;cursor:pointer">
          <p style="font:300 11px/1.6 Ubuntu,sans-serif;color:var(--muted);margin:8px 0 0">${esc(c.attachNote || 'Optional: attach a PDF up to 5 MB.')}</p>
        </div>
        <input type="checkbox" name="botcheck" tabindex="-1" style="display:none" aria-hidden="true">
        <p style="font:300 11px/1.6 Ubuntu,sans-serif;color:var(--muted);margin:0;max-width:60ch">${esc(c.consent)}</p>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 26px 22px;border-top:1px solid var(--line)">
        <p id="askMsg" role="status" style="font:300 12.5px/1.6 Ubuntu,sans-serif;color:var(--muted);margin:0;flex:1"></p>
        <button type="submit" class="btn" id="askSend" style="flex:none">Send →</button>
      </div>
    </form></div>`;
  const first = box.querySelector('input[name="name"]');
  if (first) first.focus();

  $('#askEsc').onclick = closeAsk;
  $('#askForm').onsubmit = e => { e.preventDefault(); submitAsk(e.target, detail); };
}
const closeAsk = () => { const b = $('#dialog'); b.hidden = true; b.innerHTML = ''; };

function submitAsk(form, detail) {
  const msg = $('#askMsg'), send = $('#askSend');
  const d = new FormData(form);
  const need = ['name', 'email', 'topic', 'message'].filter(k => !String(d.get(k) || '').trim());
  if (need.length) { msg.style.color = 'var(--pink)'; msg.textContent = 'Still needed: ' + need.join(', ') + '.'; return; }
  if (d.get('botcheck')) return;
  const file = d.get('attachment');
  if (file && file.size) {
    const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!pdf) { msg.style.color = 'var(--pink)'; msg.textContent = 'The attachment has to be a PDF.'; return; }
    if (file.size > 5 * 1024 * 1024) { msg.style.color = 'var(--pink)'; msg.textContent = 'That PDF is over 5 MB — please send a smaller one or a link.'; return; }
  }
  const key = (C.contact.accessKey || '').trim();
  if (!key) {
    msg.style.color = 'var(--pink)';
    msg.textContent = 'The form is not connected yet — add the Web3Forms access key to content.json.';
    return;
  }
  send.disabled = true;
  msg.style.color = 'var(--muted)';
  msg.textContent = 'Sending…';
  const payload = {
    access_key: key,
    subject: '[' + d.get('topic') + '] ' + d.get('name') + (d.get('organisation') ? ' · ' + d.get('organisation') : ''),
    from_name: 'charleneronquillo.com',
    name: d.get('name'),
    email: d.get('email'),
    organisation: d.get('organisation') || '—',
    topic: d.get('topic'),
    event_details: detail || '—',
    message: d.get('message')
  };
  let req;
  if (file && file.size) {
    const fd = new FormData();
    Object.keys(payload).forEach(k => fd.append(k, payload[k]));
    fd.append('attachment', file, file.name);
    req = fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
  } else {
    req = fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
  }
  req
    .then(r => r.json())
    .then(r => {
      if (r && r.success) {
        $('#dialog').querySelector('.card').innerHTML = `<div style="padding:40px 30px;max-width:46ch">
          <p style="font:400 22px/1.45 'Source Serif 4',serif;color:var(--ink);margin:0 0 12px">Sent. Thank you.</p>
          <p style="font:300 13.5px/1.75 Ubuntu,sans-serif;margin:0 0 20px">It has landed in the lab inbox. Replies usually go out within the week.</p>
          <button class="btn" id="askDone">Close</button></div>`;
        $('#askDone').onclick = closeAsk;
      } else {
        send.disabled = false;
        msg.style.color = 'var(--pink)';
        msg.textContent = (r && r.message) || 'That did not go through. Please try again in a moment.';
      }
    })
    .catch(() => { send.disabled = false; msg.style.color = 'var(--pink)'; msg.textContent = 'No connection — please try again in a moment.'; });
}

/* ── events ─────────────────────────────── */
function wire() {
  $('#searchBtn').onclick = () => { S.palette = true; S.pq = ''; S.pIdx = 0; renderPalette(); };
  $('#themeBtn').onclick = () => {
    S.theme = S.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', S.theme);
    try { localStorage.setItem('hie-theme-v2', S.theme); } catch (e) {}
    renderTheme();
  };

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-pane],[data-year],[data-filter],[data-hit],[data-ask],[data-proj],[data-acc],[data-bio],#reset,#gprev,#gnext,#pesc');
    if (!t) return;
    if (t.dataset.proj) { S.openKey = 'p:' + t.dataset.proj; return goPane('research'); }
    if (t.dataset.acc) { S.openKey = S.openKey === t.dataset.acc ? null : t.dataset.acc; return render(); }
    if (t.dataset.bio !== undefined) { const k = 'bio:' + t.dataset.bio; S.openKey = S.openKey === k ? null : k; return render(); }
    if (t.dataset.pane) return goPane(t.dataset.pane);
    if (t.hasAttribute('data-ask')) return openAsk(t.getAttribute('data-ask'));
    if (t.dataset.year) { S.year = S.year === t.dataset.year ? 'All' : t.dataset.year; if (t.dataset.year === 'All') S.year = 'All'; return render(); }
    if (t.dataset.filter) { S.filter = t.dataset.filter; return render(); }
    if (t.id === 'reset') { S.filter = 'All'; S.year = 'Recent'; S.q = ''; return render(); }
    if (t.id === 'gprev' || t.id === 'gnext') { const g = $('#gallery'); if (g) g.scrollBy({ left: t.id === 'gnext' ? 520 : -520, behavior: 'smooth' }); return; }
    if (t.id === 'pesc') return closePalette();
    if (t.dataset.hit !== undefined) { const h = paletteItems()[Number(t.dataset.hit)]; if (h) h.act(); }
  });

  document.addEventListener('mouseover', e => {
    const h = e.target.closest('[data-hit]');
    if (h && S.palette) { const i = Number(h.dataset.hit); if (i !== S.pIdx) { S.pIdx = i; renderPalette(); } }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'q') { S.q = e.target.value; S.focusQ = true; render(); }
    if (e.target.id === 'pq') { S.pq = e.target.value; S.pIdx = 0; renderPalette(); }
  });

  document.addEventListener('change', e => {
    const k = e.target.dataset.sel;
    if (k) { S[k] = e.target.value; render(); }
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
      e.preventDefault(); S.palette = !S.palette; S.pq = ''; S.pIdx = 0; renderPalette(); return;
    }
    if (e.key === 'Escape') { if (S.palette) closePalette(); else if (!$('#dialog').hidden) closeAsk(); return; }
    if (!S.palette) return;
    const hits = paletteItems();
    if (e.key === 'ArrowDown') { e.preventDefault(); S.pIdx = Math.min(S.pIdx + 1, hits.length - 1); renderPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); S.pIdx = Math.max(S.pIdx - 1, 0); renderPalette(); }
    else if (e.key === 'Enter' && hits[S.pIdx]) { e.preventDefault(); hits[S.pIdx].act(); }
  });

  $('#palette').addEventListener('mousedown', e => { if (e.target.id === 'palette') closePalette(); });
  $('#dialog').addEventListener('mousedown', e => { if (e.target.id === 'dialog') closeAsk(); });

  const fromHash = () => {
    const m = String(location.hash || '').match(/^#\/?(?:2a\/)?([a-z]+)$/);
    if (m && C.panes.some(p => p.key === m[1])) S.pane = m[1];
  };
  fromHash();
  window.addEventListener('hashchange', () => { const before = S.pane; fromHash(); if (S.pane !== before) render(); });
}

/* ── boot ───────────────────────────────── */
Promise.all([
  fetch('content.json').then(r => r.json()),
  fetch('publications.json').then(r => r.json()).catch(() => [])
]).then(([content, pubs]) => {
  C = content;
  PUBS = Array.isArray(pubs) ? (() => { const seen = {}, out = []; pubs.forEach(p => { const k = NORM(p.title); if (seen[k]) return; seen[k] = 1; out.push(p); }); return out; })() : [];
  C.feed.forEach(f => {
    if (f.type === 'Paper') {
      const acts = f.actions || [];
      const pick = acts.filter(a => /doi/i.test(a.label))[0] || acts[0];
      const url = (pick && pick.href) || f.href;
      f.actions = url && String(url).indexOf('http') === 0 ? [{ label: 'DOI', href: url }] : [];
    }
    const parts = String(f.venue).split(' · ');
    let note = '', venue = f.venue;
    if (parts.length > 1 && MARGIN_RX.test(parts[parts.length - 1])) { note = parts.pop(); venue = parts.join(' · '); }
    SPLIT[f.title] = { venue, note };
  });
  $('#socials').innerHTML = C.site.links.map(l => `<a href="${esc(l.url)}" style="color:var(--teal)">${esc(l.label)}</a>`).join('');
  externalize($('#socials'));
  const inv = $('#invNote');
  if (inv) inv.textContent = C.contact.invitationsNote;
  wire();
  render();
}).catch(err => {
  $('#pane').innerHTML = `<p style="font:400 18px/1.6 'Source Serif 4',serif;color:var(--ink);padding:40px 0">The site content could not be loaded. ${esc(err && err.message || '')}</p>`;
});
