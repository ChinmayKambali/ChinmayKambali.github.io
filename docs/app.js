/* Portfolio renderer: everything on the page comes from data.json.
   Edit content with the Portfolio Manager, not here. */
(function () {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const has = (v) => Array.isArray(v) ? v.length > 0 : (v != null && String(v).trim() !== '');
  const list = (v) => Array.isArray(v) ? v.filter(has) : [];

  // Only allow safe link targets (web, mail, phone, or files in this site).
  function safeUrl(u) {
    if (!has(u)) return '';
    u = String(u).trim();
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''; // block javascript:, data:, etc.
    if (/^www\./i.test(u)) return 'https://' + u;
    return u.replace(/^\/+/, '');
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(d) {
    if (!has(d)) return '';
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(d).trim());
    if (!m) return String(d);
    return MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }
  function range(start, end, current) {
    const s = fmtDate(start), e = current ? 'Present' : fmtDate(end);
    if (s && e) return s + ' – ' + e;
    return s || e || '';
  }
  function hue(str) {
    let h = 0;
    for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 360;
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
  // Email links open a Gmail compose window (instead of the visitor's default mail app, e.g. Outlook).
  const gmail = (email) => 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(String(email).trim());
  const ext = (url) => /^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';

  // ---------- icons ----------
  const I = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z"/></svg>',
    leetcode: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.48 0a1.37 1.37 0 0 0-.96.44L7.12 6.2l-2.6 2.8a5.3 5.3 0 0 0-1.26 2.07 5.6 5.6 0 0 0-.1 2.86 5.1 5.1 0 0 0 1.38 2.52l4.33 4.36a5.3 5.3 0 0 0 7.42.04l2.62-2.61a1.38 1.38 0 0 0-1.95-1.95l-2.62 2.62a2.54 2.54 0 0 1-3.52-.02l-4.33-4.36a2.42 2.42 0 0 1-.07-3.36L10.64 7.8 14.5 3.66a1.38 1.38 0 0 0-1.02-3.66Zm-2.2 12.04a1.38 1.38 0 0 0 0 2.75h8.97a1.38 1.38 0 0 0 0-2.75h-8.97Z"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1 0-4h2M18 9h2a2 2 0 0 0 0-4h-2M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2-1.2.5-2 2-2 3.8M14 14.7V17c0 .6.5 1 1 1.2 1.2.5 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };

  function socialLinks(p) {
    const items = [
      ['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['twitter', 'X / Twitter'],
      ['leetcode', 'LeetCode'], ['website', 'Website']
    ];
    let out = items.filter(([k]) => has(p[k])).map(([k, label]) => {
      const u = safeUrl(p[k]);
      return u ? `<a href="${esc(u)}"${ext(u)} aria-label="${label}" title="${label}">${I[k === 'website' ? 'web' : k]}</a>` : '';
    }).join('');
    if (has(p.email)) out += `<a href="${esc(gmail(p.email))}" target="_blank" rel="noopener" aria-label="Email ${esc(p.email)}" title="Email ${esc(p.email)}">${I.mail}</a>`;
    return out ? `<div class="socials">${out}</div>` : '';
  }

  function chips(arr, cls = '') {
    const a = list(arr);
    return a.length ? `<div class="chips">${a.map((t) => `<span class="chip ${cls}">${esc(t)}</span>`).join('')}</div>` : '';
  }

  function head(eyebrow, title, sub) {
    return `<div class="section-head reveal"><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
  }

  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)
      .map((t) => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`).join('');
  }

  function projectMedia(p, cls) {
    const img = safeUrl(p.image);
    if (img) return `<img src="${esc(img)}" alt="${esc(p.title)} screenshot" loading="lazy">`;
    const h = hue(p.title);
    return `<div class="project-ph ${cls || ''}" style="background:linear-gradient(135deg,hsl(${h} 70% 45%),hsl(${(h + 50) % 360} 75% 35%))">${esc(p.title)}</div>`;
  }

  // ---------- sections ----------
  const S = {};

  S.hero = (d) => {
    const p = d.profile || {};
    const first = esc(String(p.name || '').trim().split(/\s+/)[0] || '');
    const rest = esc(String(p.name || '').trim().split(/\s+/).slice(1).join(' '));
    const photo = safeUrl(p.photo);
    const resume = safeUrl(p.resume);
    const hasProjects = list(d.projects).length > 0;
    const contactLink = has(p.email) ? `href="${esc(gmail(p.email))}" target="_blank" rel="noopener"` : 'href="#contact"';
    return `
    <section class="hero" id="top">
      <div class="container hero-grid${photo ? '' : ' no-photo'}">
        <div class="reveal">
          ${has(p.availability) ? `<div class="status"><span class="status-dot"></span>${esc(p.availability)}</div>` : ''}
          <h1>Hi, I'm <span class="grad">${first}</span>${rest ? ' ' + rest : ''}</h1>
          ${has(p.title) ? `<div class="hero-title">${esc(p.title)}</div>` : ''}
          ${has(p.tagline) ? `<p class="hero-tagline">${esc(p.tagline)}</p>` : ''}
          <div class="hero-cta">
            ${hasProjects ? `<a class="btn btn-primary" href="#projects">View my work ${I.arrow}</a>` : ''}
            ${resume ? `<a class="btn" href="${esc(resume)}" target="_blank" rel="noopener">${I.download} Resume</a>` : ''}
            <a class="btn" ${contactLink}>${I.mail} Contact</a>
          </div>
          <div class="hero-meta">
            ${has(p.location) ? `<span>${I.pin}${esc(p.location)}</span>` : ''}
            ${socialLinks(p)}
          </div>
        </div>
        ${photo ? `<div class="avatar-wrap reveal"><img class="avatar" src="${esc(photo)}" alt="Photo of ${esc(p.name)}"></div>` : ''}
      </div>
    </section>`;
  };

  S.about = (d) => {
    const p = d.profile || {};
    if (!has(p.about)) return '';
    const stats = [
      [list(d.projects).length, 'Projects built'],
      [list(d.experience).length, 'Roles & internships'],
      [list(d.skills).reduce((n, g) => n + list(g.items).length, 0), 'Technologies used'],
      [list(d.certifications).length, 'Certifications']
    ].filter(([n]) => n > 0);
    return `
    <section class="block" id="about"><div class="container">
      ${head('About', 'A bit about me')}
      <div class="about-grid">
        <div class="about-text reveal">${paragraphs(p.about)}</div>
        ${stats.length ? `<div class="stats reveal">${stats.map(([n, l]) => `<div class="card stat"><b>${n}${n >= 10 ? '+' : ''}</b><span>${l}</span></div>`).join('')}</div>` : ''}
      </div>
    </div></section>`;
  };

  S.experience = (d) => {
    const items = list(d.experience);
    if (!items.length) return '';
    return `
    <section class="block" id="experience"><div class="container">
      ${head('Experience', 'Where I\'ve worked')}
      <div class="timeline">
        ${items.map((e) => {
          const cu = safeUrl(e.companyUrl);
          const company = cu ? `<a href="${esc(cu)}"${ext(cu)}>${esc(e.company)}</a>` : esc(e.company);
          const meta = [e.type, e.location].filter(has).map(esc).join(' · ');
          return `
          <article class="card tl-item reveal">
            <div class="tl-top"><h3>${esc(e.role)}</h3><span class="tl-date">${esc(range(e.start, e.end, e.current))}</span></div>
            <div class="tl-org">${company}${meta ? ` <span class="muted">· ${meta}</span>` : ''}</div>
            ${has(e.summary) ? `<p class="tl-summary">${esc(e.summary)}</p>` : ''}
            ${list(e.highlights).length ? `<ul class="tl-list">${list(e.highlights).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
            ${chips(e.tech)}
          </article>`;
        }).join('')}
      </div>
    </div></section>`;
  };

  S.projects = (d) => {
    const items = list(d.projects);
    if (!items.length) return '';
    const sorted = items.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    const cats = [...new Set(sorted.map((p) => p.category).filter(has))];
    return `
    <section class="block" id="projects"><div class="container">
      ${head('Projects', 'Things I\'ve built', 'Click any project for details, live demos and source code.')}
      ${cats.length > 1 ? `<div class="filters reveal" role="tablist">
        <button class="filter active" data-filter="*">All</button>
        ${cats.map((c) => `<button class="filter" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>` : ''}
      <div class="projects-grid">
        ${sorted.map((p) => {
          const live = safeUrl(p.liveUrl), repo = safeUrl(p.repoUrl);
          return `
          <article class="card project reveal" data-cat="${esc(p.category || '')}" data-id="${esc(p.id)}" tabindex="0" role="button" aria-label="Open details for ${esc(p.title)}">
            <div class="project-media">${projectMedia(p)}${p.featured ? '<span class="badge-featured">★ Featured</span>' : ''}</div>
            <div class="project-body">
              ${has(p.category) ? `<div class="project-cat">${esc(p.category)}${has(p.date) ? ` · ${esc(fmtDate(p.date))}` : ''}</div>` : ''}
              <h3>${esc(p.title)}</h3>
              ${has(p.summary) ? `<p>${esc(p.summary)}</p>` : ''}
              ${chips(list(p.tech).slice(0, 5))}
              <div class="project-links">
                ${live ? `<a class="btn btn-sm btn-primary" href="${esc(live)}"${ext(live)}>${I.external} Live</a>` : ''}
                ${repo ? `<a class="btn btn-sm" href="${esc(repo)}"${ext(repo)}>${I.github} Code</a>` : ''}
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
    </div></section>`;
  };

  S.skills = (d) => {
    const groups = list(d.skills).filter((g) => list(g.items).length);
    if (!groups.length) return '';
    return `
    <section class="block" id="skills"><div class="container">
      ${head('Skills', 'My toolkit')}
      <div class="skills-grid">
        ${groups.map((g) => `<div class="card skill-card reveal"><h3>${esc(g.group || 'Skills')}</h3>${chips(g.items)}</div>`).join('')}
      </div>
    </div></section>`;
  };

  S.education = (d) => {
    const items = list(d.education);
    if (!items.length) return '';
    return `
    <section class="block" id="education"><div class="container">
      ${head('Education', 'Education')}
      <div class="grid-2">
        ${items.map((e) => {
          const deg = [e.degree, e.field].filter(has).map(esc).join(', ');
          const meta = [range(e.start, e.end), e.location, has(e.grade) ? 'Grade: ' + e.grade : ''].filter(has);
          return `
          <article class="card edu cert reveal">
            <div class="cert-icon">${I.cap}</div>
            <div>
              <h3>${esc(e.institution)}</h3>
              ${deg ? `<div class="tl-org">${deg}</div>` : ''}
              ${meta.length ? `<div class="edu-meta">${meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>` : ''}
              ${list(e.highlights).length ? `<ul class="tl-list">${list(e.highlights).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
            </div>
          </article>`;
        }).join('')}
      </div>
    </div></section>`;
  };

  S.certifications = (d) => {
    const items = list(d.certifications);
    if (!items.length) return '';
    return `
    <section class="block" id="certifications"><div class="container">
      ${head('Certifications', 'Certifications')}
      <div class="grid-2">
        ${items.map((c) => {
          const u = safeUrl(c.url), f = safeUrl(c.file);
          const meta = [c.issuer, fmtDate(c.date)].filter(has).map(esc).join(' · ');
          return `
          <article class="card cert reveal">
            <div class="cert-icon">${I.award}</div>
            <div>
              <h3>${esc(c.name)}</h3>
              ${meta ? `<div class="muted">${meta}</div>` : ''}
              ${has(c.credentialId) ? `<div class="muted">Credential ID: ${esc(c.credentialId)}</div>` : ''}
              <div style="display:flex;flex-wrap:wrap;gap:0 16px">
                ${f ? `<a class="link" href="${esc(f)}" target="_blank" rel="noopener">View certificate ${I.external}</a>` : ''}
                ${u ? `<a class="link" href="${esc(u)}"${ext(u)}>Verify ${I.external}</a>` : ''}
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
    </div></section>`;
  };

  S.achievements = (d) => {
    const items = list(d.achievements);
    if (!items.length) return '';
    return `
    <section class="block" id="achievements"><div class="container">
      ${head('Achievements', 'Achievements & activities')}
      <div class="grid-2">
        ${items.map((a) => {
          const u = safeUrl(a.url);
          return `
          <article class="card cert reveal">
            <div class="cert-icon">${I.trophy}</div>
            <div>
              <h3>${esc(a.title)}</h3>
              ${has(a.date) ? `<div class="muted">${esc(fmtDate(a.date))}</div>` : ''}
              ${has(a.description) ? `<p class="muted">${esc(a.description)}</p>` : ''}
              ${u ? `<a class="link" href="${esc(u)}"${ext(u)}>Learn more ${I.external}</a>` : ''}
            </div>
          </article>`;
        }).join('')}
      </div>
    </div></section>`;
  };

  S.testimonials = (d) => {
    const items = list(d.testimonials);
    if (!items.length) return '';
    return `
    <section class="block" id="testimonials"><div class="container">
      ${head('Testimonials', 'What people say')}
      <div class="grid-2">
        ${items.map((t) => {
          const ph = safeUrl(t.photo), u = safeUrl(t.url);
          const nm = u ? `<a href="${esc(u)}"${ext(u)}>${esc(t.name)}</a>` : esc(t.name);
          return `
          <figure class="card quote reveal" style="margin:0">
            <blockquote>${esc(t.quote)}</blockquote>
            <figcaption class="quote-by">
              ${ph ? `<img src="${esc(ph)}" alt="" loading="lazy">` : `<span class="q-init">${esc(initials(t.name))}</span>`}
              <div><b>${nm}</b>${has(t.role) ? `<span>${esc(t.role)}</span>` : ''}</div>
            </figcaption>
          </figure>`;
        }).join('')}
      </div>
    </div></section>`;
  };

  S.contact = (d) => {
    const p = d.profile || {};
    const resume = safeUrl(p.resume);
    const social = socialLinks(p);
    if (!has(p.email) && !has(p.phone) && !social && !resume) return '';
    return `
    <section class="block" id="contact"><div class="container">
      <div class="card contact-card reveal">
        <div class="eyebrow">Contact</div>
        <h2>Let's build something together</h2>
        <p>${has(p.availability) ? esc(p.availability) + '. ' : ''}Have a role, project or idea in mind? I'd love to hear about it.</p>
        <div class="hero-cta">
          ${has(p.email) ? `<a class="btn btn-primary" href="${esc(gmail(p.email))}" target="_blank" rel="noopener">${I.mail} ${esc(p.email)}</a>` : ''}
          ${has(p.phone) ? `<a class="btn" href="tel:${esc(String(p.phone).replace(/[^\d+]/g, ''))}">${I.phone} ${esc(p.phone)}</a>` : ''}
          ${resume ? `<a class="btn" href="${esc(resume)}" target="_blank" rel="noopener">${I.download} View resume</a>` : ''}
        </div>
        ${social}
      </div>
    </div></section>`;
  };

  const ORDER = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements', 'testimonials', 'contact'];
  const LABELS = { about: 'About', experience: 'Experience', projects: 'Projects', skills: 'Skills', education: 'Education', certifications: 'Certifications', achievements: 'Achievements', testimonials: 'Testimonials', contact: 'Contact' };

  // ---------- behaviour ----------
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    $('#themeBtn').innerHTML = t === 'dark' ? I.sun : I.moon;
  }

  function openProject(d, id) {
    const p = list(d.projects).find((x) => String(x.id) === String(id));
    if (!p) return;
    const live = safeUrl(p.liveUrl), repo = safeUrl(p.repoUrl);
    $('#modalBody').innerHTML = `
      <div class="modal-media">${projectMedia(p)}</div>
      <div class="modal-content">
        ${has(p.category) ? `<div class="project-cat">${esc(p.category)}${has(p.date) ? ` · ${esc(fmtDate(p.date))}` : ''}</div>` : ''}
        <h3 id="modalTitle">${esc(p.title)}</h3>
        ${has(p.description) ? `<p>${esc(p.description)}</p>` : has(p.summary) ? `<p>${esc(p.summary)}</p>` : ''}
        ${chips(p.tech, 'chip-accent')}
        <div class="project-links">
          ${live ? `<a class="btn btn-primary" href="${esc(live)}"${ext(live)}>${I.external} Live demo</a>` : ''}
          ${repo ? `<a class="btn" href="${esc(repo)}"${ext(repo)}>${I.github} Source code</a>` : ''}
        </div>
      </div>`;
    const m = $('#modal');
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    m.querySelector('.modal-close').focus();
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
  }

  function render(d) {
    const p = d.profile || {};
    const st = d.settings || {};
    if (has(st.accent)) document.documentElement.style.setProperty('--accent', st.accent);
    document.title = st.siteTitle || [p.name, p.title].filter(has).join(' — ') || 'Portfolio';
    const desc = st.metaDescription || p.tagline || '';
    document.querySelector('meta[name="description"]').setAttribute('content', desc);
    document.querySelector('meta[property="og:title"]').setAttribute('content', document.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', desc);

    const html = ORDER.map((k) => S[k](d)).join('');
    $('#main').innerHTML = html;

    // Brand + nav built only from sections that have content
    $('#brand').innerHTML = `<span class="brand-mark">${esc(initials(p.name))}</span><span>${esc(p.name || 'Portfolio')}</span>`;
    $('#navLinks').innerHTML = ORDER.filter((k) => LABELS[k] && document.getElementById(k))
      .map((k) => `<a href="#${k}" data-sec="${k}">${LABELS[k]}</a>`).join('');

    $('#footer').innerHTML = `<div class="container"><span>© ${new Date().getFullYear()} ${esc(p.name || '')}</span><span>${has(p.github) ? `<a href="${esc(safeUrl(p.github))}" target="_blank" rel="noopener">GitHub</a> · ` : ''}<a href="#top">Back to top ↑</a></span></div>`;

    wire(d);
  }

  function wire(d) {
    // project filters
    document.querySelectorAll('.filter').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((x) => x.classList.toggle('active', x === b));
      const f = b.dataset.filter;
      document.querySelectorAll('.project').forEach((c) => {
        c.style.display = f === '*' || c.dataset.cat === f ? '' : 'none';
      });
    }));
    // project modal
    document.querySelectorAll('.project').forEach((c) => {
      c.addEventListener('click', (e) => { if (!e.target.closest('a')) openProject(d, c.dataset.id); });
      c.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) { e.preventDefault(); openProject(d, c.dataset.id); } });
    });
    // reveal on scroll
    const els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      els.forEach((el) => io.observe(el));
    } else els.forEach((el) => el.classList.add('in'));
    // scroll spy
    const links = [...document.querySelectorAll('#navLinks a')];
    const secs = links.map((a) => document.getElementById(a.dataset.sec)).filter(Boolean);
    const onScroll = () => {
      $('#nav').classList.toggle('scrolled', window.scrollY > 10);
      let cur = '';
      secs.forEach((s) => { if (s.getBoundingClientRect().top < 140) cur = s.id; });
      links.forEach((a) => a.classList.toggle('active', a.dataset.sec === cur));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() {
    setTheme(document.documentElement.dataset.theme || 'dark');
    $('#menuBtn').innerHTML = I.menu;
    $('.modal-close').innerHTML = I.close;
    $('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    const nl = $('#navLinks'), mb = $('#menuBtn');
    mb.addEventListener('click', () => {
      const open = nl.classList.toggle('open');
      mb.setAttribute('aria-expanded', open);
      mb.innerHTML = open ? I.close : I.menu;
    });
    nl.addEventListener('click', (e) => {
      if (e.target.closest('a')) { nl.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.innerHTML = I.menu; }
    });
    $('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

    fetch('data.json?v=' + Date.now(), { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(render)
      .catch((err) => {
        $('#main').innerHTML = `<div class="loading">Couldn't load portfolio data (${esc(err.message)}).</div>`;
      });
  }

  init();
})();
