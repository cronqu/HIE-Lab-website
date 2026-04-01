/* ========================================
   HIE Lab Website — script.js
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  loadContent();
  loadPublications();
  initNavigation();
  document.getElementById('footer-year').textContent = new Date().getFullYear();
});

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
  document.getElementById('hero-tagline').textContent = hero.tagline || '';
  document.getElementById('hero-land-ack').textContent = hero.land_acknowledgement || '';
}

// ──────────────────────────────────────────
// Director
// ──────────────────────────────────────────

function renderDirector(d) {
  if (!d) return;
  const container = document.getElementById('director-content');

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
// Research / Projects
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

  const active = [...(projects.active || [])].sort((a, b) =>
    extractLatestYear(b.funding) - extractLatestYear(a.funding)
  );
  const past = [...(projects.past || [])].sort((a, b) =>
    extractLatestYear(b.funding) - extractLatestYear(a.funding)
  );

  let html = '<div class="projects-grid">';
  active.forEach(p => {
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

  if (past.length) {
    html += '<h3 class="past-projects-title">Collaborations &amp; Past Projects</h3>';
    past.forEach(p => {
      html += `
        <div class="past-project-item">
          <h4>${esc(p.title)}${p.url ? ` <a href="${esc(p.url)}" target="_blank" rel="noopener">[Link]</a>` : ''}</h4>
          ${p.funding ? `<div class="project-meta"><strong>Funding:</strong> ${esc(p.funding)}</div>` : ''}
          ${p.co_investigators ? `<div class="project-meta"><strong>Team:</strong> ${esc(p.co_investigators)}</div>` : ''}
        </div>`;
    });
  }

  container.innerHTML = html;
}

// ──────────────────────────────────────────
// Team
// ──────────────────────────────────────────

function renderTeam(team) {
  if (!team) return;
  const container = document.getElementById('team-content');
  let html = '';

  if (team.values) {
    html += `<p class="team-intro"><em>${esc(team.values)}</em></p>`;
  }

  if (team.core_values && team.core_values.length) {
    html += '<div class="core-values">' +
      team.core_values.map(v => `<span>${esc(v)}</span>`).join('') +
      '</div>';
  }

  if (team.description) {
    html += `<p class="team-intro">${esc(team.description)}</p>`;
  }

  // Current members
  if (team.current && team.current.length) {
    html += '<div class="team-grid">';
    team.current.forEach(m => {
      const initials = m.name.split(' ').map(n => n.charAt(0)).join('');
      const photoHTML = m.photo
        ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" class="team-photo"
               onerror="this.outerHTML='<div class=\\'team-photo-placeholder\\'>${esc(initials)}</div>'">`
        : `<div class="team-photo-placeholder">${esc(initials)}</div>`;

      html += `
        <div class="team-card">
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

  // Furry members
  if (team.furry && team.furry.length) {
    html += '<h3 class="furry-section-title">Furry Lab Members</h3>';
    team.furry.forEach(f => {
      html += `
        <div class="furry-card">
          <div class="team-name">${esc(f.name)} <span style="color:var(--colour-muted);font-size:0.85rem">(${esc(f.breed || '')})</span></div>
          <div class="team-role">${esc(f.role || '')}</div>
          <p class="team-bio"><strong>Likes:</strong> ${esc(f.likes || '')}</p>
          <p class="team-bio"><strong>Dislikes:</strong> ${esc(f.dislikes || '')}</p>
        </div>`;
    });
  }

  // Alumni
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
        <div class="team-card">
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
  const container = document.getElementById('publications-list');
  try {
    const res = await fetch('publications.json');
    if (!res.ok) throw new Error('Failed to load publications');
    const pubs = await res.json();
    renderPublications(pubs, container);
  } catch (err) {
    container.innerHTML = '<p class="publications-error">Unable to load publications. Please try again later.</p>';
    console.error('Publications loading error:', err);
  }
}

function renderPublications(pubs, container) {
  if (!pubs || !pubs.length) {
    container.innerHTML = '<p class="publications-error">No publications available.</p>';
    return;
  }

  pubs.sort((a, b) => (b.year || 0) - (a.year || 0));

  const currentYear = new Date().getFullYear();
  const oldestYear = currentYear - 5;

  // Group by year, filter to last 5 years
  const grouped = {};
  pubs.forEach(pub => {
    const year = pub.year || 0;
    if (year < oldestYear) return;
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(pub);
  });

  // Sort years descending
  const years = Object.keys(grouped).sort((a, b) => b - a);

  let html = '';
  years.forEach(year => {
    const items = grouped[year];
    // Show all for current year, max 2 for prior years
    const display = (parseInt(year) === currentYear) ? items : items.slice(0, 2);
    const hidden = items.length - display.length;

    html += `<h3 class="pub-year">${esc(String(year))}</h3><ol class="pub-list">`;
    display.forEach(pub => {
      const doiLink = pub.doi
        ? ` <a href="https://doi.org/${esc(pub.doi)}" class="pub-doi" target="_blank" rel="noopener">[DOI]</a>`
        : '';
      const urlLink = pub.url && !pub.doi
        ? ` <a href="${esc(pub.url)}" class="pub-link" target="_blank" rel="noopener">[Link]</a>`
        : '';
      html += `<li class="pub-item"><span class="pub-citation">${esc(pub.vancouver_citation || pub.title || '')}</span>${doiLink}${urlLink}</li>`;
    });
    html += '</ol>';
    if (hidden > 0) {
      html += `<p class="pub-more">+ ${hidden} more publication${hidden > 1 ? 's' : ''}</p>`;
    }
  });

  container.innerHTML = html;
}

// ──────────────────────────────────────────
// News
// ──────────────────────────────────────────

function renderNews(news) {
  if (!news || !news.length) return;
  const container = document.getElementById('news-content');

  const sorted = [...news].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  let html = '<div class="news-list">';
  sorted.forEach(item => {
    const dateLabel = formatNewsDate(item.date);
    html += `
      <div class="news-item">
        <div class="news-date">${esc(dateLabel)}</div>
        <div class="news-text">
          ${esc(item.text || '')}
          ${item.url ? `<br><a href="${esc(item.url)}" target="_blank" rel="noopener">Read more &rarr;</a>` : ''}
        </div>
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
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
// Talks
// ──────────────────────────────────────────

function renderTalks(talks) {
  if (!talks || !talks.length) return;
  const container = document.getElementById('talks-content');

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
  const container = document.getElementById('Working With Me-content') || document.getElementById('opportunities-content');

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

  // Teaching
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
// Navigation
// ──────────────────────────────────────────

function initNavigation() {
  const navbar = document.getElementById('navbar');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

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

  // Active section highlighting
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a');

  const updateActive = () => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.id;
      }
    });
    navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('href') === `#${current}`);
    });
  };

  window.addEventListener('scroll', updateActive);
  updateActive();
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
