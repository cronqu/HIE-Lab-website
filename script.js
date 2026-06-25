/* ========================================
   HIE Lab Website — script.js
   Multi-page architecture: each page declares
   only the section containers it needs; render
   functions no-op when their target is absent.
   ======================================== */

const NAV_LINKS = [
  { href: 'index.html', label: 'Home' },
  { href: 'team.html', label: 'Team' },
  { href: 'research.html', label: 'Research' },
  { href: 'publications.html', label: 'Publications' },
  { href: 'news.html', label: 'News' },
  { href: 'index.html#gallery', label: 'Gallery' },
  { href: 'opportunities.html', label: 'Opportunities' },
];

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  initNavigation();
  injectBackToTop();
  loadContent();
  loadPublications();
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// ──────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────

function injectNav() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const currentPage = path === '' ? 'index.html' : path;

  const linksHTML = NAV_LINKS.map(l => {
    const [linkPage, linkHash] = l.href.split('#');
    const samePage = linkPage.toLowerCase() === currentPage;
    const isActive = linkHash
      ? samePage && location.hash === '#' + linkHash
      : samePage;
    return `<li><a href="${l.href}"${isActive ? ' class="active"' : ''}>${l.label}</a></li>`;
  }).join('');

  nav.innerHTML = `
    <a href="index.html" class="nav-logo">
      <img src="assets/images/logo-colour-primary.svg" alt="HIE Lab">
    </a>
    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">&#9776;</button>
    <ul class="nav-links">${linksHTML}</ul>
  `;
}

function initNavigation() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const toggle = navbar.querySelector('.nav-toggle');
  const links = navbar.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const expanded = links.classList.toggle('active');
      toggle.setAttribute('aria-expanded', expanded);
    });

    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

// ──────────────────────────────────────────
// Back to top
// ──────────────────────────────────────────

function injectBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '&uarr;';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}

// ──────────────────────────────────────────
// Content Loading
// ──────────────────────────────────────────

async function loadContent() {
  try {
    const res = await fetch('content.json');
    if (!res.ok) throw new Error('Failed to load content');
    const data = await res.json();

    renderHero(data.hero);
    renderDirector(data.director);
    renderResearch(data.projects);
    renderTeam(data.team);
    renderAdvisory(data.advisory);
    renderNews(data.news);
    renderNewsPreview(data.news);
    renderGallery(data.gallery);
    renderTalks(data.talks);
    renderOpportunities(data.opportunities, data.teaching);
  } catch (err) {
    console.error('Content loading error:', err);
  }
}

// ──────────────────────────────────────────
// Hero
// ──────────────────────────────────────────

function renderHero(hero) {
  if (!hero) return;
  const tagline = document.getElementById('hero-tagline');
  const landAck = document.getElementById('hero-land-ack');
  if (tagline) tagline.textContent = hero.tagline || '';
  if (landAck) landAck.textContent = hero.land_acknowledgement || '';
}

// ──────────────────────────────────────────
// Director
// ──────────────────────────────────────────

function renderDirector(d) {
  if (!d) return;
  const container = document.getElementById('director-content');
  if (!container) return;

  const photoHTML = d.photo
    ? `<img src="${esc(d.photo)}" alt="${esc(d.name)}" class="director-photo"
           onerror="this.outerHTML='<div class=\\'director-photo-placeholder\\'>${esc(d.name.charAt(0))}</div>'">`
    : `<div class="director-photo-placeholder">${esc(d.name.charAt(0))}</div>`;

  const identitiesHTML = (d.identities || [])
    .map(id => `<span>${esc(id)}</span>`).join('');

  const bioHTML = Array.isArray(d.bio)
    ? d.bio.map(p => `<p>${esc(p)}</p>`).join('')
    : `<p>${esc(d.bio || '')}</p>`;

  const linksHTML = buildDirectorLinks(d.links || {});

  const affiliationsHTML = (d.affiliations || []).map(a =>
    `<div class="affiliation-item">
      <strong>${esc(a.title)}</strong> &mdash;
      ${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.org)}</a>` : esc(a.org)}
    </div>`
  ).join('');

  container.innerHTML = `
    <div class="director-layout">
      <div class="director-photo-wrap">${photoHTML}</div>
      <div>
        <h3 class="director-name">${esc(d.name)}</h3>
        <div class="director-credentials">${esc(d.credentials || '')}</div>
        <div class="director-pronouns">${esc(d.pronouns || '')}</div>
        <div class="director-title">${esc(d.title || '')}</div>
        <div class="director-identities">${identitiesHTML}</div>
        <div class="director-bio">${bioHTML}</div>
        <div class="director-address">${esc(d.department || '')}<br>${(d.address || '').split('\n').map(esc).join('<br>')}</div>
        <div class="director-links">${linksHTML}</div>
        <h4 class="affiliations-title">Affiliations</h4>
        <div class="affiliations-list">${affiliationsHTML}</div>
        ${d.funding_acknowledgement ? `<div class="funding-ack">${esc(d.funding_acknowledgement)}</div>` : ''}
      </div>
    </div>
  `;
}

function buildDirectorLinks(links) {
  const items = [];
  if (links.email) items.push(`<a href="mailto:${esc(links.email)}">Email</a>`);
  if (links.google_scholar) items.push(`<a href="${esc(links.google_scholar)}" target="_blank" rel="noopener">Google Scholar</a>`);
  if (links.orcid) items.push(`<a href="${esc(links.orcid)}" target="_blank" rel="noopener">ORCID</a>`);
  if (links.linkedin) items.push(`<a href="${esc(links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
  if (links.twitter) items.push(`<a href="${esc(links.twitter)}" target="_blank" rel="noopener">Twitter</a>`);
  return items.join('');
}

// ──────────────────────────────────────────
// Research / Projects (with filters)
// ──────────────────────────────────────────

function extractLatestYear(text) {
  if (!text) return 0;
  const matches = text.match(/\b(20\d{2})\b/g);
  if (!matches) return 0;
  return Math.max(...matches.map(Number));
}

function renderResearch(projects) {
  if (!projects) return;
  const container = document.getElementById('research-content');
  if (!container) return;

  const active = [...(projects.active || [])].sort((a, b) =>
    extractLatestYear(b.funding) - extractLatestYear(a.funding)
  );
  const past = [...(projects.past || [])].sort((a, b) =>
    extractLatestYear(b.funding) - extractLatestYear(a.funding)
  );

  const filterContainer = document.getElementById('research-filters');
  const hasFilters = !!filterContainer;
  const state = { status: 'all', query: '' };

  const projectMatches = (p, q) => {
    if (!q) return true;
    const hay = [p.title, p.description, p.funding, p.co_investigators]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  };

  function paint() {
    const q = state.query.trim().toLowerCase();
    const showActive = state.status === 'all' || state.status === 'active';
    const showPast = state.status === 'all' || state.status === 'past';

    const activeFiltered = showActive ? active.filter(p => projectMatches(p, q)) : [];
    const pastFiltered = showPast ? past.filter(p => projectMatches(p, q)) : [];

    let html = '';

    if (activeFiltered.length) {
      html += '<div class="projects-grid">';
      activeFiltered.forEach(p => {
        html += `
          <div class="project-card">
            <h3>${esc(p.title)}</h3>
            ${p.status ? `<span class="project-status">${esc(p.status)}</span>` : ''}
            ${p.funding ? `<div class="project-meta"><strong>Funding:</strong> ${esc(p.funding)}</div>` : ''}
            ${p.co_investigators ? `<div class="project-meta"><strong>Co-Is:</strong> ${esc(p.co_investigators)}</div>` : ''}
            <p class="project-description">${esc(p.description || '')}</p>
            ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Learn more</a>` : ''}
          </div>`;
      });
      html += '</div>';
    }

    if (pastFiltered.length) {
      html += '<h3 class="past-projects-title">Collaborations &amp; Past Projects</h3>';
      pastFiltered.forEach(p => {
        html += `
          <div class="past-project-item">
            <h4>${esc(p.title)}${p.url ? ` <a href="${esc(p.url)}" target="_blank" rel="noopener">[Link]</a>` : ''}</h4>
            ${p.funding ? `<div class="project-meta"><strong>Funding:</strong> ${esc(p.funding)}</div>` : ''}
            ${p.co_investigators ? `<div class="project-meta"><strong>Team:</strong> ${esc(p.co_investigators)}</div>` : ''}
          </div>`;
      });
    }

    if (!activeFiltered.length && !pastFiltered.length) {
      html = '<p class="filter-empty">No projects match your filters.</p>';
    }

    container.innerHTML = html;
  }

  if (hasFilters) {
    filterContainer.innerHTML = `
      <div class="filter-bar">
        <input type="search" class="filter-search" placeholder="Search projects..." aria-label="Search projects">
        <div class="filter-chips">
          <button class="filter-chip active" data-status="all">All (${active.length + past.length})</button>
          <button class="filter-chip" data-status="active">Active (${active.length})</button>
          <button class="filter-chip" data-status="past">Past (${past.length})</button>
        </div>
      </div>
    `;
    const search = filterContainer.querySelector('.filter-search');
    const chips = filterContainer.querySelectorAll('.filter-chip');
    search.addEventListener('input', () => { state.query = search.value; paint(); });
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.status = chip.dataset.status;
        paint();
      });
    });
  }

  paint();
}

// ──────────────────────────────────────────
// Team
// ──────────────────────────────────────────

function renderTeam(team) {
  if (!team) return;
  const container = document.getElementById('team-content');
  if (!container) return;

  let html = '';

  if (team.description) {
    html += `<p class="team-intro">${esc(team.description)}</p>`;
  }

  if (team.current && team.current.length) {
    html += '<div class="team-grid">';
    team.current.forEach(m => {
      const initials = m.name.split(' ').map(n => n.charAt(0)).join('');
      const photoHTML = m.photo
        ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" class="team-photo"
               onerror="this.outerHTML='<div class=\\'team-photo-placeholder\\'>${esc(initials)}</div>'">`
        : `<div class="team-photo-placeholder">${esc(initials)}</div>`;

      html += `
        <div class="team-card"${m.bio ? ' data-has-bio' : ''} onclick="this.classList.toggle('expanded')">
          ${photoHTML}
          <div class="team-info">
            <div class="team-name">${esc(m.name)}</div>
            ${m.pronouns ? `<div class="team-pronouns">(${esc(m.pronouns)})</div>` : ''}
            <div class="team-role">${esc(m.role || '')}</div>
            <p class="team-bio">${esc(m.bio || '')}</p>
          </div>
        </div>`;
    });
    html += '</div>';
  }

  const furry = team.furry || team['furry team members'];
  if (furry && furry.length) {
    html += '<h3 class="furry-section-title">Furry Lab Members</h3><div class="team-grid">';
    furry.forEach(f => {
      const photoHTML = f.photo
        ? `<img src="${esc(f.photo)}" alt="${esc(f.name)}" class="team-photo">`
        : `<div class="team-photo-placeholder">🐾</div>`;
      html += `
        <div class="team-card" onclick="this.classList.toggle('expanded')">
          ${photoHTML}
          <div class="team-info">
            <div class="team-name">${esc(f.name)} <span style="color:var(--colour-muted);font-size:0.85rem">(${esc(f.breed || '')})</span></div>
            <div class="team-role">${esc(f.role || '')}</div>
            <p class="team-bio"><strong>Likes:</strong> ${esc(f.likes || '')}<br><strong>Dislikes:</strong> ${esc(f.dislikes || '')}</p>
          </div>
        </div>`;
    });
    html += '</div>';
  }

  if (team.alumni && team.alumni.length) {
    html += '<h3 class="alumni-section-title">Alumni</h3><div class="alumni-list">';
    team.alumni.forEach(a => {
      html += `<div class="alumni-item"><strong>${esc(a.name)}</strong> &mdash; <span>${esc(a.role || '')}</span></div>`;
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

// ──────────────────────────────────────────
// HIE PIE Advisory
// ──────────────────────────────────────────

function renderAdvisory(advisory) {
  if (!advisory) return;
  const container = document.getElementById('advisory-content');
  if (!container) return;

  let html = '';

  if (advisory.intro) {
    html += `<p class="team-intro">${esc(advisory.intro)}</p>`;
  }

  if (advisory.members && advisory.members.length) {
    html += '<div class="team-grid">';
    advisory.members.forEach(m => {
      const initials = m.name.split(' ').map(n => n.charAt(0)).join('');
      const photoHTML = m.photo
        ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" class="team-photo"
               onerror="this.outerHTML='<div class=\\'team-photo-placeholder\\'>${esc(initials)}</div>'">`
        : `<div class="team-photo-placeholder">${esc(initials)}</div>`;

      html += `
        <div class="team-card"${m.bio ? ' data-has-bio' : ''} onclick="this.classList.toggle('expanded')">
          ${photoHTML}
          <div class="team-info">
            <div class="team-name">${esc(m.name)}</div>
            <div class="team-role">${esc(m.role || '')}</div>
            <p class="team-bio">${esc(m.bio || '')}</p>
          </div>
        </div>`;
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

// ──────────────────────────────────────────
// Publications
// ──────────────────────────────────────────

async function loadPublications() {
  const previewEl = document.getElementById('publications-preview');
  const archiveEl = document.getElementById('publications-list');
  if (!previewEl && !archiveEl) return;

  try {
    const res = await fetch('publications.json');
    if (!res.ok) throw new Error('Failed to load publications');
    const pubs = await res.json();
    pubs.sort((a, b) => (b.year || 0) - (a.year || 0));

    if (previewEl) renderPublicationsPreview(pubs, previewEl);
    if (archiveEl) initPublicationsArchive(pubs, archiveEl);
  } catch (err) {
    [previewEl, archiveEl].forEach(el => {
      if (el) el.innerHTML = '<p class="publications-error">Unable to load publications. Please try again later.</p>';
    });
    console.error('Publications loading error:', err);
  }
}

function renderPublicationsPreview(pubs, container, limit = 5) {
  if (!pubs || !pubs.length) {
    container.innerHTML = '<p class="publications-error">No publications available.</p>';
    return;
  }
  const recent = pubs.slice(0, limit);
  let html = '<ol class="pub-list">';
  recent.forEach(pub => html += pubItemHTML(pub));
  html += '</ol>';
  html += `<p class="view-all"><a href="publications.html">View all publications &rarr;</a></p>`;
  container.innerHTML = html;
}

function pubItemHTML(pub) {
  const doiLink = pub.doi
    ? ` <a href="https://doi.org/${esc(pub.doi)}" class="pub-doi" target="_blank" rel="noopener">[DOI]</a>`
    : '';
  const urlLink = pub.url && !pub.doi
    ? ` <a href="${esc(pub.url)}" class="pub-link" target="_blank" rel="noopener">[Link]</a>`
    : '';
  return `<li class="pub-item"><span class="pub-citation">${esc(pub.vancouver_citation || pub.title || '')}</span>${doiLink}${urlLink}</li>`;
}

function initPublicationsArchive(pubs, container) {
  if (!pubs || !pubs.length) {
    container.innerHTML = '<p class="publications-error">No publications available.</p>';
    return;
  }

  const allYears = [...new Set(pubs.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
  const state = { years: new Set(), query: '' };

  const filterEl = document.getElementById('publications-filters');
  const jumpEl = document.getElementById('publications-year-jump');

  if (filterEl) {
    filterEl.innerHTML = `
      <div class="filter-bar">
        <input type="search" class="filter-search" placeholder="Search publications..." aria-label="Search publications">
        <div class="filter-chips">
          <button class="filter-chip active" data-year="all">All years</button>
          ${allYears.map(y => `<button class="filter-chip" data-year="${y}">${y}</button>`).join('')}
        </div>
      </div>
    `;
    const search = filterEl.querySelector('.filter-search');
    const chips = filterEl.querySelectorAll('.filter-chip');
    search.addEventListener('input', () => { state.query = search.value; paint(); });
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const year = chip.dataset.year;
        if (year === 'all') {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          state.years.clear();
        } else {
          filterEl.querySelector('.filter-chip[data-year="all"]').classList.remove('active');
          chip.classList.toggle('active');
          if (chip.classList.contains('active')) state.years.add(Number(year));
          else state.years.delete(Number(year));
          if (state.years.size === 0) {
            filterEl.querySelector('.filter-chip[data-year="all"]').classList.add('active');
          }
        }
        paint();
      });
    });
  }

  function paint() {
    const q = state.query.trim().toLowerCase();
    const filtered = pubs.filter(p => {
      if (state.years.size && !state.years.has(p.year)) return false;
      if (q && !(p.vancouver_citation || p.title || '').toLowerCase().includes(q)) return false;
      return true;
    });

    if (!filtered.length) {
      container.innerHTML = '<p class="filter-empty">No publications match your filters.</p>';
      if (jumpEl) jumpEl.innerHTML = '';
      return;
    }

    const grouped = {};
    filtered.forEach(p => {
      const y = p.year || 'Unknown';
      (grouped[y] = grouped[y] || []).push(p);
    });
    const visibleYears = Object.keys(grouped).sort((a, b) => b - a);

    let html = `<p class="archive-count">Showing ${filtered.length} publication${filtered.length === 1 ? '' : 's'}.</p>`;
    visibleYears.forEach(year => {
      html += `<h3 class="pub-year" id="year-${esc(String(year))}">${esc(String(year))}</h3><ol class="pub-list">`;
      grouped[year].forEach(pub => html += pubItemHTML(pub));
      html += '</ol>';
    });
    container.innerHTML = html;

    if (jumpEl) {
      jumpEl.innerHTML = `
        <div class="year-jump-strip" role="navigation" aria-label="Jump to year">
          <span class="year-jump-label">Jump to:</span>
          ${visibleYears.map(y => `<button class="year-jump-btn" data-year="${esc(String(y))}">${esc(String(y))}</button>`).join('')}
        </div>
      `;
      jumpEl.querySelectorAll('.year-jump-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = document.getElementById('year-' + btn.dataset.year);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  }

  paint();
}

// ──────────────────────────────────────────
// News (preview + full archive with filters)
// ──────────────────────────────────────────

function renderNewsPreview(news, limit = 5) {
  if (!news || !news.length) return;
  const container = document.getElementById('news-preview-content');
  if (!container) return;

  const sorted = [...news].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const recent = sorted.slice(0, limit);

  let html = '<div class="news-list">';
  recent.forEach(item => html += newsItemHTML(item));
  html += '</div>';
  html += `<p class="view-all"><a href="news.html">View all news &rarr;</a></p>`;
  container.innerHTML = html;
}

function newsItemHTML(item) {
  const dateLabel = formatNewsDate(item.date);
  return `
    <div class="news-item">
      <div class="news-date">${esc(dateLabel)}</div>
      <div class="news-text">
        ${renderInlineLinks(item.text || '')}
        ${item.url ? `<br><a href="${esc(item.url)}" target="_blank" rel="noopener">Read more &rarr;</a>` : ''}
      </div>
    </div>`;
}

function renderInlineLinks(text) {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIdx = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(esc(text.slice(lastIdx, m.index)));
    parts.push(`<a href="${esc(m[2])}" target="_blank" rel="noopener">${esc(m[1])}</a>`);
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(esc(text.slice(lastIdx)));
  return parts.join('');
}

function renderNews(news) {
  if (!news || !news.length) return;
  const container = document.getElementById('news-content');
  if (!container) return;

  const sorted = [...news].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const allYears = [...new Set(sorted.map(n => (n.date || '').slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const filterEl = document.getElementById('news-filters');
  const jumpEl = document.getElementById('news-year-jump');
  const state = { years: new Set(), query: '' };

  if (filterEl) {
    filterEl.innerHTML = `
      <div class="filter-bar">
        <input type="search" class="filter-search" placeholder="Search news..." aria-label="Search news">
        <div class="filter-chips">
          <button class="filter-chip active" data-year="all">All years</button>
          ${allYears.map(y => `<button class="filter-chip" data-year="${y}">${y}</button>`).join('')}
        </div>
      </div>
    `;
    const search = filterEl.querySelector('.filter-search');
    const chips = filterEl.querySelectorAll('.filter-chip');
    search.addEventListener('input', () => { state.query = search.value; paint(); });
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const year = chip.dataset.year;
        if (year === 'all') {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          state.years.clear();
        } else {
          filterEl.querySelector('.filter-chip[data-year="all"]').classList.remove('active');
          chip.classList.toggle('active');
          if (chip.classList.contains('active')) state.years.add(year);
          else state.years.delete(year);
          if (state.years.size === 0) {
            filterEl.querySelector('.filter-chip[data-year="all"]').classList.add('active');
          }
        }
        paint();
      });
    });
  }

  function paint() {
    const q = state.query.trim().toLowerCase();
    const filtered = sorted.filter(item => {
      const y = (item.date || '').slice(0, 4);
      if (state.years.size && !state.years.has(y)) return false;
      if (q && !(item.text || '').toLowerCase().includes(q)) return false;
      return true;
    });

    if (!filtered.length) {
      container.innerHTML = '<p class="filter-empty">No news items match your filters.</p>';
      if (jumpEl) jumpEl.innerHTML = '';
      return;
    }

    const grouped = {};
    filtered.forEach(item => {
      const y = (item.date || '').slice(0, 4) || 'Unknown';
      (grouped[y] = grouped[y] || []).push(item);
    });
    const visibleYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    let html = `<p class="archive-count">Showing ${filtered.length} item${filtered.length === 1 ? '' : 's'}.</p>`;
    html += '<div class="news-list">';
    visibleYears.forEach(year => {
      html += `<h3 class="news-year-heading" id="news-year-${esc(year)}">${esc(year)}</h3>`;
      grouped[year].forEach(item => html += newsItemHTML(item));
    });
    html += '</div>';
    container.innerHTML = html;

    if (jumpEl) {
      jumpEl.innerHTML = `
        <div class="year-jump-strip" role="navigation" aria-label="Jump to year">
          <span class="year-jump-label">Jump to:</span>
          ${visibleYears.map(y => `<button class="year-jump-btn" data-year="${esc(y)}">${esc(y)}</button>`).join('')}
        </div>
      `;
      jumpEl.querySelectorAll('.year-jump-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = document.getElementById('news-year-' + btn.dataset.year);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  }

  paint();
}

function formatNewsDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${months[monthIdx] || parts[1]} ${parts[0]}`;
  }
  return dateStr;
}

// ──────────────────────────────────────────
// Photo Gallery
// ──────────────────────────────────────────

function renderGallery(gallery) {
  if (!gallery || !gallery.photos || !gallery.photos.length) return;
  const container = document.getElementById('gallery-content');
  if (!container) return;

  const photos = gallery.photos;
  let currentIndex = 0;

  container.innerHTML = `
    <div class="gallery-slideshow">
      <div class="gallery-slide">
        <img src="${esc(photos[0].src)}" alt="${esc(photos[0].alt || '')}" class="gallery-img">
      </div>
      <div class="gallery-dots">
        ${photos.map((_, i) => `<button class="gallery-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Photo ${i + 1}"></button>`).join('')}
      </div>
    </div>`;

  const slide = container.querySelector('.gallery-slide');
  const img = slide.querySelector('.gallery-img');
  const dots = container.querySelectorAll('.gallery-dot');

  function showSlide(index) {
    currentIndex = index;
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = photos[index].src;
      img.alt = photos[index].alt || '';
      img.style.opacity = '1';
    }, 400);
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      showSlide(parseInt(dot.dataset.index));
      resetTimer();
    });
  });

  let timer = setInterval(() => {
    showSlide((currentIndex + 1) % photos.length);
  }, 5000);

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      showSlide((currentIndex + 1) % photos.length);
    }, 5000);
  }
}

// ──────────────────────────────────────────
// Talks
// ──────────────────────────────────────────

function renderTalks(talks) {
  if (!talks || !talks.length) return;
  const container = document.getElementById('talks-content');
  if (!container) return;

  let html = '<div class="talks-grid">';
  talks.forEach(talk => {
    const videoHTML = talk.youtube_id
      ? `<div class="talk-video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(talk.youtube_id)}" title="${esc(talk.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
      : '';

    html += `
      <div class="talk-card">
        ${videoHTML}
        <div class="talk-info">
          <h3>${esc(talk.title)}</h3>
          <p>${esc(talk.description || '')}</p>
        </div>
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ──────────────────────────────────────────
// Opportunities
// ──────────────────────────────────────────

function renderOpportunities(opp, teaching) {
  if (!opp) return;
  const container = document.getElementById('opportunities-content');
  if (!container) return;

  let html = '<div class="opportunities-content">';

  if (opp.grad_status) {
    html += `<div class="grad-status">${esc(opp.grad_status)}</div>`;
  }

  html += `<p>${esc(opp.intro || '')}</p>`;
  html += `<p>${esc(opp.collaboration_text || '')}</p>`;

  html += `<h3>Postdocs &amp; Visiting Scholars</h3>`;
  html += `<p>${esc(opp.postdoc_text || '')}</p>`;

  html += `<h3>Graduate Students</h3>`;
  html += `<p>${esc(opp.grad_general || '')}</p>`;
  html += `<p>${esc(opp.grad_interest || '')}</p>`;

  if (opp.grad_programs && opp.grad_programs.length) {
    html += '<p>Programs:</p><ul>';
    opp.grad_programs.forEach(p => {
      html += `<li><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a></li>`;
    });
    html += '</ul>';
  }

  if (opp.phd_requirements && opp.phd_requirements.length) {
    html += '<h3>Prospective PhD Students</h3><ul>';
    opp.phd_requirements.forEach(r => {
      html += `<li>${esc(r)}</li>`;
    });
    html += '</ul>';
  }

  html += `<h3>Undergraduate RAs / Interns</h3>`;
  html += `<p>${esc(opp.undergrad_text || '')}</p>`;

  if (opp.application_requirements && opp.application_requirements.length) {
    html += '<h3>How to Apply</h3><ul>';
    opp.application_requirements.forEach(r => {
      html += `<li>${esc(r)}</li>`;
    });
    html += '</ul>';
  }

  if (opp.application_video) {
    html += `<p><a href="${esc(opp.application_video)}" target="_blank" rel="noopener">Watch: Preparing a graduate school application (video)</a></p>`;
  }

  if (teaching && teaching.length) {
    html += '<h3>Teaching</h3><div class="teaching-list">';
    teaching.forEach(t => {
      html += `<div class="teaching-year">${esc(t.year)}</div>`;
      html += '<ul class="teaching-courses">';
      (t.courses || []).forEach(c => {
        html += `<li>${esc(c)}</li>`;
      });
      html += '</ul>';
    });
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

// ──────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────

function esc(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
