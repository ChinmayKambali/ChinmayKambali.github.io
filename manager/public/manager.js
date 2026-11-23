/* Portfolio Manager UI */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => c != null && c !== false && el.append(c.nodeType ? c : document.createTextNode(c)));
    return el;
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtMonth = (v) => { const m = /^(\d{4})-(\d{2})/.exec(v || ''); return m ? MONTHS[+m[2] - 1] + ' ' + m[1] : (v || ''); };
  const uid = (k) => k.slice(0, 2) + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const assetUrl = (v) => !v ? '' : /^(https?:|data:)/i.test(v) ? v : '/preview/' + String(v).replace(/^\/+/, '');

  let schema, data, current = 'profile', editing = null, dirty = false, siteUrl = '';

  // ---------- api ----------
  async function api(path, body) {
    const r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.ok === false) throw Object.assign(new Error(j.error || ('Request failed: ' + r.status)), { log: j.log });
    return j;
  }
  async function save(msg) {
    await api('/api/data', { data });
    dirty = false;
    toast(msg || 'Saved ✓  Click Publish when you want it live.');
    refreshStatus();
    renderNav();
  }

  function toast(msg, err) {
    const t = $('#toast');
    t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(t._t); t._t = setTimeout(() => (t.className = 'toast'), err ? 5000 : 2600);
  }

  // Simple modal dialog. buttons: [{label, value, cls}]
  function dialog(title, body, buttons) {
    return new Promise((resolve) => {
      const d = $('#dialog');
      $('#dlgTitle').textContent = title;
      const b = $('#dlgBody'); b.innerHTML = '';
      if (typeof body === 'string') b.append(h('p', {}, body)); else if (body) b.append(body);
      const a = $('#dlgActions'); a.innerHTML = '';
      buttons.forEach((bt) => a.append(h('button', { class: 'btn ' + (bt.cls || ''), value: bt.value, type: 'submit' }, bt.label)));
      d.onclose = () => resolve(d.returnValue);
      d.returnValue = '';
      d.showModal();
    });
  }
  const confirmLeave = async () => !dirty || (await dialog('Discard changes?', 'You have unsaved changes in this form.', [
    { label: 'Keep editing', value: 'no' }, { label: 'Discard', value: 'yes', cls: 'danger solid' }])) === 'yes';

  // ---------- status / publish ----------
  async function refreshStatus() {
    try {
      const s = await api('/api/status');
      siteUrl = s.siteUrl || '';
      const live = $('#liveLink');
      if (siteUrl) { live.href = siteUrl; live.hidden = false; }
      const st = $('#statusText');
      if (!s.isRepo) { st.textContent = 'Not connected to a live site yet'; st.className = 'app-sub'; }
      else if (s.pending) { st.textContent = `● ${s.changes} unpublished change${s.changes === 1 ? '' : 's'}`; st.className = 'app-sub pending'; }
      else { st.textContent = '✓ Live site is up to date'; st.className = 'app-sub clean'; }
    } catch (e) { /* ignore */ }
  }

  async function doPublish() {
    if (dirty) { toast('Save your form first.', true); return; }
    const inp = h('input', { type: 'text', value: 'Update portfolio content', 'aria-label': 'Description of the change' });
    const body = h('div', { style: 'display:grid;gap:10px' },
      h('p', {}, 'This uploads your saved changes to GitHub. The live site refreshes in about a minute.'),
      h('label', {}, h('div', { style: 'font-weight:600;margin-bottom:6px' }, 'What changed? (optional note)'), inp));
    const ok = await dialog('Publish to your live site?', body, [{ label: 'Cancel', value: 'no' }, { label: '⬆ Publish', value: 'yes', cls: 'primary' }]);
    if (ok !== 'yes') return;
    const btn = $('#publishBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Publishing…';
    try {
      const r = await api('/api/publish', { message: inp.value.trim() || 'Update portfolio content' });
      const b = h('div', { style: 'display:grid;gap:10px' },
        h('p', {}, 'Your changes are uploaded. GitHub takes about a minute to rebuild the site, then refresh the page.'),
        r.siteUrl ? h('p', {}, h('a', { href: r.siteUrl, target: '_blank', rel: 'noopener', style: 'color:var(--accent);font-weight:700' }, r.siteUrl)) : null,
        h('details', {}, h('summary', { style: 'cursor:pointer;color:var(--muted)' }, 'Technical details'), h('pre', {}, r.log || '')));
      await dialog('Published 🎉', b, [{ label: 'Done', value: 'ok', cls: 'primary' }]);
    } catch (e) {
      await dialog('Publish failed', h('div', { style: 'display:grid;gap:10px' }, h('p', {}, e.message), e.log ? h('pre', {}, e.log) : null),
        [{ label: 'OK', value: 'ok' }]);
    } finally {
      btn.disabled = false; btn.textContent = '⬆ Publish';
      refreshStatus();
    }
  }

  // ---------- navigation ----------
  const cat = () => schema.categories.find((c) => c.key === current);

  function renderNav() {
    const nav = $('#catNav'); nav.innerHTML = '';
    schema.categories.forEach((c) => {
      const n = c.single ? null : (data[c.key] || []).length;
      nav.append(h('button', {
        class: 'cat' + (c.key === current ? ' active' : ''),
        onclick: async () => { if (await confirmLeave()) { dirty = false; current = c.key; editing = null; render(); } }
      }, h('span', { class: 'ico' }, c.icon), c.label, n != null ? h('span', { class: 'count' }, String(n)) : null));
    });
  }

  function render() {
    window.scrollTo(0, 0);
    renderNav();
    const c = cat();
    if (c.single) return renderForm(c, data[c.key] || {}, null);
    if (editing === null) return renderList(c);
    const items = data[c.key] || [];
    renderForm(c, editing === -1 ? {} : items[editing], editing);
  }

  // ---------- list view ----------
  function renderList(c) {
    const v = $('#view'); v.innerHTML = '';
    const items = data[c.key] = data[c.key] || [];
    v.append(h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, c.icon + ' ' + c.label), h('p', {}, c.help)),
      h('button', { class: 'btn primary', onclick: () => { editing = -1; render(); } }, '+ Add new')));

    if (!items.length) {
      v.append(h('div', { class: 'empty' }, `Nothing here yet. Click “+ Add new” to add your first ${c.label.toLowerCase().replace(/s$/, '')}.`));
      return;
    }
    const list = h('div', { class: 'entries' });
    items.forEach((it, i) => {
      let sub = it[c.subtitleField];
      if (Array.isArray(sub)) sub = sub.join(', ');
      else if (/^\d{4}-\d{2}/.test(sub || '')) sub = fmtMonth(sub);
      if (c.key === 'experience') sub = [it.company, [fmtMonth(it.start), it.current ? 'Present' : fmtMonth(it.end)].filter(Boolean).join(' – ')].filter(Boolean).join(' · ');
      const move = async (dir) => {
        const j = i + dir; if (j < 0 || j >= items.length) return;
        [items[i], items[j]] = [items[j], items[i]];
        await save('Order saved ✓'); renderList(c);
      };
      list.append(h('div', { class: 'entry' },
        h('div', { class: 'entry-main', onclick: () => { editing = i; render(); }, title: 'Edit' },
          h('div', { class: 'entry-title' }, it.featured ? h('span', { class: 'star' }, '★ ') : null, it[c.titleField] || '(untitled)'),
          sub ? h('div', { class: 'entry-sub' }, sub) : null),
        h('div', { class: 'entry-actions' },
          h('button', { class: 'btn sm', title: 'Move up', 'aria-label': 'Move up', disabled: i === 0, onclick: () => move(-1) }, '↑'),
          h('button', { class: 'btn sm', title: 'Move down', 'aria-label': 'Move down', disabled: i === items.length - 1, onclick: () => move(1) }, '↓'),
          h('button', { class: 'btn sm', onclick: () => { editing = i; render(); } }, '✎ Edit'),
          h('button', {
            class: 'btn sm danger', onclick: async () => {
              const ans = await dialog('Delete this entry?', `“${it[c.titleField] || 'Untitled'}” will be removed from your portfolio. (A backup of your data is kept in manager/backups.)`,
                [{ label: 'Cancel', value: 'no' }, { label: 'Delete', value: 'yes', cls: 'danger solid' }]);
              if (ans !== 'yes') return;
              items.splice(i, 1); await save('Deleted ✓'); renderList(c);
            }
          }, '🗑'))));
    });
    v.append(list);
    v.append(h('p', { style: 'color:var(--muted);font-size:.85rem;margin-top:14px' }, 'Use ↑ ↓ to change the order they appear on your site.'));
  }

  // ---------- form view ----------
  function renderForm(c, item, index) {
    const v = $('#view'); v.innerHTML = '';
    const isNew = index === -1;
    if (c.single) {
      v.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, c.icon + ' ' + c.label), h('p', {}, c.help))));
    } else {
      v.append(h('div', { class: 'page-head' }, h('div', {},
        h('div', { class: 'crumb' }, h('button', { onclick: async () => { if (await confirmLeave()) { dirty = false; editing = null; render(); } } }, '← ' + c.label)),
        h('h1', {}, isNew ? `Add ${c.label.replace(/s$/, '').toLowerCase()}` : (item[c.titleField] || 'Edit')))));
    }

    const controls = c.fields.map((f) => buildField(f, item[f.key], c));
    const form = h('form', { class: 'form', novalidate: true, oninput: () => (dirty = true), onchange: () => (dirty = true) },
      controls.map((x) => x.el));

    const actions = h('div', { class: 'form-actions' });
    if (!c.single && !isNew) {
      actions.append(h('button', {
        type: 'button', class: 'btn danger left', onclick: async () => {
          const ans = await dialog('Delete this entry?', 'It will be removed from your portfolio.', [{ label: 'Cancel', value: 'no' }, { label: 'Delete', value: 'yes', cls: 'danger solid' }]);
          if (ans !== 'yes') return;
          data[c.key].splice(index, 1); dirty = false; await save('Deleted ✓'); editing = null; render();
        }
      }, '🗑 Delete'));
    }
    if (!c.single) actions.append(h('button', { type: 'button', class: 'btn', onclick: async () => { if (await confirmLeave()) { dirty = false; editing = null; render(); } } }, 'Cancel'));
    actions.append(h('button', { type: 'submit', class: 'btn primary' }, isNew ? '+ Add to portfolio' : '✓ Save'));
    form.append(actions);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let ok = true, first = null;
      controls.forEach((x) => { const good = x.validate(); if (!good && !first) first = x.el; ok = ok && good; });
      if (!ok) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Please fill in the highlighted fields.', true); return; }
      const out = Object.assign({}, c.single ? {} : { id: (item && item.id) || uid(c.key) });
      // keep any fields this form doesn't know about
      Object.assign(out, item || {});
      controls.forEach((x) => (out[x.key] = x.get()));
      try {
        if (c.single) data[c.key] = out;
        else if (isNew) data[c.key].unshift(out);
        else data[c.key][index] = out;
        await save(isNew ? 'Added ✓  Click Publish when you want it live.' : undefined);
        if (!c.single) { editing = null; render(); }
      } catch (err) { toast('Save failed: ' + err.message, true); }
    });
    v.append(form);
    const firstInput = form.querySelector('input:not([type=hidden]),textarea');
    if (firstInput && isNew) firstInput.focus();
  }

  function buildField(f, value, c) {
    const id = 'f-' + f.key;
    const wrap = h('div', { class: 'field' });
    const label = h('label', { class: 'lbl', for: id }, f.label, f.required ? h('span', { class: 'req' }, ' *') : null);
    const help = f.help ? h('div', { class: 'help' }, f.help) : null;
    const errEl = h('div', { class: 'help err', hidden: true }, 'This field is required.');
    let get, input;

    switch (f.type) {
      case 'textarea':
        input = h('textarea', { id, rows: f.rows || 3, placeholder: f.placeholder || '' }); input.value = value || '';
        get = () => input.value.trim(); break;
      case 'lines':
        input = h('textarea', { id, rows: f.rows || 4, placeholder: f.placeholder || 'One item per line' });
        input.value = Array.isArray(value) ? value.join('\n') : (value || '');
        get = () => input.value.split('\n').map((s) => s.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean); break;
      case 'select':
        input = h('select', { id }, h('option', { value: '' }, '— choose —'), (f.options || []).map((o) => h('option', { value: o }, o)));
        input.value = value || ''; get = () => input.value; break;
      case 'checkbox': {
        input = h('input', { type: 'checkbox', id }); input.checked = !!value;
        wrap.append(h('label', { class: 'check', for: id }, input, f.label));
        if (help) wrap.append(help);
        return { el: wrap, key: f.key, get: () => input.checked, validate: () => true };
      }
      case 'color': {
        const presets = ['#7c5cff', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
        input = h('input', { type: 'color', id }); input.value = value || '#7c5cff';
        const sw = h('div', { class: 'swatches' });
        const mark = () => sw.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('on', s.dataset.c === input.value));
        presets.forEach((p) => sw.append(h('button', { type: 'button', class: 'swatch', 'data-c': p, style: 'background:' + p, title: p, onclick: () => { input.value = p; mark(); dirty = true; } })));
        input.addEventListener('input', mark); mark();
        wrap.append(label, h('div', { class: 'color-row' }, input, sw)); if (help) wrap.append(help);
        return { el: wrap, key: f.key, get: () => input.value, validate: () => true };
      }
      case 'tags': return tagField(f, value, wrap, label, help, errEl, id);
      case 'image': case 'file': return mediaField(f, value, wrap, label, help, id);
      default: {
        const type = f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : f.type === 'month' ? 'month' : 'text';
        input = h('input', { type, id, placeholder: f.placeholder || (type === 'url' ? 'https://…' : type === 'month' ? 'YYYY-MM' : '') });
        input.value = value || '';
        if (f.suggestFrom && c) {
          const opts = [...new Set((data[c.key] || []).map((x) => x[f.suggestFrom]).filter(Boolean))];
          if (opts.length) {
            const dl = h('datalist', { id: id + '-dl' }, opts.map((o) => h('option', { value: o })));
            input.setAttribute('list', id + '-dl'); wrap.append(dl);
          }
        }
        get = () => {
          let s = input.value.trim();
          if (type === 'url' && s && !/^[a-z][a-z0-9+.-]*:/i.test(s) && !s.startsWith('uploads/')) s = 'https://' + s;
          return s;
        };
      }
    }
    wrap.append(label, input); if (help) wrap.append(help); wrap.append(errEl);
    return {
      el: wrap, key: f.key, get,
      validate: () => {
        const val = get(); const bad = !!(f.required && (Array.isArray(val) ? !val.length : !val));
        wrap.classList.toggle('invalid', bad); errEl.hidden = !bad; return !bad;
      }
    };
  }

  function tagField(f, value, wrap, label, help, errEl, id) {
    let tags = Array.isArray(value) ? value.slice() : (value ? String(value).split(',').map((s) => s.trim()).filter(Boolean) : []);
    const box = h('div', { class: 'tags', onclick: () => input.focus() });
    const input = h('input', { id, type: 'text', placeholder: f.placeholder || 'Type and press Enter' });
    const draw = () => {
      box.querySelectorAll('.tag').forEach((t) => t.remove());
      tags.forEach((t, i) => box.insertBefore(h('span', { class: 'tag' }, t,
        h('button', { type: 'button', 'aria-label': 'Remove ' + t, onclick: (e) => { e.stopPropagation(); tags.splice(i, 1); dirty = true; draw(); } }, '×')), input));
    };
    const commit = () => {
      const parts = input.value.split(',').map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => { if (!tags.some((t) => t.toLowerCase() === p.toLowerCase())) tags.push(p); });
      if (parts.length) { input.value = ''; dirty = true; draw(); }
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
      else if (e.key === 'Backspace' && !input.value && tags.length) { tags.pop(); dirty = true; draw(); }
    });
    input.addEventListener('blur', commit);
    input.addEventListener('paste', () => setTimeout(commit, 0));
    box.append(input); draw();
    wrap.append(label, box, h('div', { class: 'help' }, (f.help ? f.help + ' ' : '') + 'Press Enter or comma after each one. You can paste a comma-separated list.'), errEl);
    return {
      el: wrap, key: f.key,
      get: () => { commit(); return tags.slice(); },
      validate: () => { commit(); const bad = !!(f.required && !tags.length); wrap.classList.toggle('invalid', bad); errEl.hidden = !bad; return !bad; }
    };
  }

  function mediaField(f, value, wrap, label, help, id) {
    let val = value || '';
    const isImg = f.type === 'image';
    const thumb = h('div', { class: 'thumb' });
    const pill = h('div', { class: 'filepill' });
    const urlIn = h('input', { type: 'text', id, placeholder: isImg ? '…or paste an image URL' : '…or paste a link' });
    const file = h('input', { type: 'file', accept: f.accept || (isImg ? 'image/*' : '*/*'), hidden: true });
    const removeBtn = h('button', { type: 'button', class: 'btn sm danger', onclick: () => { val = ''; urlIn.value = ''; dirty = true; draw(); } }, 'Remove');
    const draw = () => {
      const u = assetUrl(val);
      const showImg = val && (isImg || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(val));
      thumb.style.backgroundImage = showImg ? `url("${u.replace(/"/g, '%22')}")` : '';
      thumb.textContent = showImg ? '' : (val ? (/\.pdf$/i.test(val) ? '📄 PDF' : '📎 File') : (isImg ? 'No image' : 'No file'));
      pill.innerHTML = '';
      if (val) pill.append('Current: ', h('a', { href: u, target: '_blank', rel: 'noopener' }, val));
      removeBtn.hidden = !val;
    };
    file.addEventListener('change', () => {
      const fl = file.files[0]; if (!fl) return;
      if (fl.size > 25 * 1024 * 1024) { toast('That file is over 25 MB. Please use a smaller one.', true); return; }
      const rd = new FileReader();
      thumb.textContent = 'Uploading…';
      rd.onload = async () => {
        try {
          const r = await api('/api/upload', { name: fl.name, data: rd.result });
          val = r.path; urlIn.value = ''; dirty = true; draw(); toast('Uploaded ✓  Remember to Save.');
        } catch (e) { toast(e.message, true); draw(); }
        file.value = '';
      };
      rd.readAsDataURL(fl);
    });
    urlIn.addEventListener('change', () => { const s = urlIn.value.trim(); if (s) { val = /^https?:/i.test(s) || s.startsWith('uploads/') ? s : 'https://' + s; draw(); } });
    draw();
    wrap.append(label, h('div', { class: 'media' }, thumb, h('div', { class: 'media-ctl' },
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn sm', onclick: () => file.click() }, isImg ? '🖼 Upload image' : '📎 Upload file'), removeBtn),
      urlIn, pill)), file);
    if (help) wrap.append(help);
    return { el: wrap, key: f.key, get: () => val, validate: () => true };
  }

  // ---------- boot ----------
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  $('#publishBtn').addEventListener('click', doPublish);

  Promise.all([api('/api/schema'), api('/api/data')]).then(([s, d]) => {
    schema = s; data = d || {};
    schema.categories.forEach((c) => { if (!c.single && !Array.isArray(data[c.key])) data[c.key] = []; if (c.single && !data[c.key]) data[c.key] = {}; });
    render(); refreshStatus();
    setInterval(refreshStatus, 15000);
  }).catch((e) => { $('#view').innerHTML = ''; $('#view').append(h('div', { class: 'empty' }, 'Could not load: ' + e.message)); });
})();
