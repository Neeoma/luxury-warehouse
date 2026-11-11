/* ==========================================================================
   Luxury Warehouse — interactions
   Edit CONFIG, ZONES and UNITS below to change business details and content.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Content & settings ---------- */
  const CONFIG = {
    email: 'hello@luxurywarehouse.example', // quote requests are addressed here
    currency: 'USD',
    locale: 'en-US',
    ratePerPallet: { storage: 14, climate: 32, fulfilment: 22, distribution: 18 }, // per pallet, per month
    serviceLabel: { storage: 'Pallet storage', climate: 'Climate vault', fulfilment: 'Fulfilment', distribution: 'Distribution' },
    addons: [
      { id: 'insurance', label: 'Goods insurance', pct: 0.04 },
      { id: 'access', label: '24/7 access', flat: 350 },
      { id: 'whiteglove', label: 'White-glove handling', perPallet: 6 },
      { id: 'portal', label: 'Portal & API integration', flat: 180 }
    ],
    volumeDiscount: [[1000, 0.12], [500, 0.08], [200, 0.04]], // [min pallets, discount]
    termDiscount: [[24, 0.10], [12, 0.05]]                    // [min months, discount]
  };

  const ZONES = {
    receiving: { tag: 'Zone A', title: 'Receiving docks', img: 'assets/img/dock.jpg',
      text: 'Six levelled dock doors with a covered inspection lane. Every inbound pallet is checked, weighed, photographed and labelled before it moves any further.',
      specs: [['Dock doors', '6'], ['Turnaround', '< 45 min'], ['Inspection', '100%'], ['Hours', '06–22']] },
    highbay: { tag: 'Zone B', title: 'High-bay racking', img: 'assets/img/hero.jpg',
      text: 'The heart of the building. Narrow-aisle racking rises fourteen metres, served by wire-guided trucks, with each position barcoded and tracked live.',
      specs: [['Positions', '14,200'], ['Clear height', '14 m'], ['Floor load', '8 t/m²'], ['Fire system', 'ESFR']] },
    vault: { tag: 'Zone C', title: 'Climate vault', img: 'assets/img/vault.jpg',
      text: 'A sealed, glass-walled room held within half a degree of its set point. Built for wine, art, pharmaceuticals and anything that dislikes change.',
      specs: [['Temperature', '12–18 °C'], ['Humidity', '50–60%'], ['Tolerance', '± 0.5 °C'], ['Backup', 'Dual power']] },
    secure: { tag: 'Zone D', title: 'Secure cage', img: 'assets/img/vault.jpg',
      text: 'A steel-mesh enclosure for high-value and bonded goods. Entry is by individual credential, logged, and covered by continuous recording.',
      specs: [['Access', 'Biometric'], ['CCTV', '24 / 7'], ['Positions', '900'], ['Status', 'Bonded']] },
    automation: { tag: 'Zone E', title: 'Automated picking', img: 'assets/img/automation.jpg',
      text: 'Autonomous robots bring stock to the picker, not the other way round. Faster orders, fewer touches and near-perfect accuracy.',
      specs: [['Robots', '36'], ['Lines / hour', '2,400'], ['Accuracy', '99.9%'], ['Cut-off', '18:00']] },
    dispatch: { tag: 'Zone F', title: 'Dispatch docks', img: 'assets/img/exterior.jpg',
      text: 'Outbound orders are staged by route and loaded in sequence. Each consignment leaves with seal numbers and photographic proof of loading.',
      specs: [['Dock doors', '14'], ['Daily capacity', '120 trailers'], ['Same-day', 'Yes'], ['Tracking', 'Live']] }
  };

  const UNITS = [
    { id: 'HB-120', name: 'High-bay block', cat: 'Pallet', size: '120 positions', spec: 'Ambient · 14 m racking', rate: 1560, avail: 62, img: 'assets/img/hero.jpg', pos: '50% 60%' },
    { id: 'HB-480', name: 'Dedicated aisle', cat: 'Pallet', size: '480 positions', spec: 'Ambient · full aisle', rate: 5900, avail: 25, img: 'assets/img/aisle.jpg', pos: '50% 40%' },
    { id: 'CV-01', name: 'Vault bay', cat: 'Climate', size: '40 m²', spec: '12–18 °C · 55% RH', rate: 2400, avail: 38, img: 'assets/img/vault.jpg', pos: '50% 50%' },
    { id: 'CV-04', name: 'Private vault', cat: 'Climate', size: '160 m²', spec: 'Own set point · glass-walled', rate: 8800, avail: 12, img: 'assets/img/vault.jpg', pos: '80% 50%' },
    { id: 'SC-02', name: 'Secure cage', cat: 'Secure', size: '60 positions', spec: 'Biometric · bonded', rate: 1950, avail: 45, img: 'assets/img/automation.jpg', pos: '20% 50%' },
    { id: 'FF-10', name: 'Fulfilment cell', cat: 'Fulfilment', size: '300 pick faces', spec: 'Robot-served · 18:00 cut-off', rate: 4200, avail: 54, img: 'assets/img/automation.jpg', pos: '70% 50%' },
    { id: 'BK-900', name: 'Bulk floor', cat: 'Bulk', size: '900 m²', spec: 'Block stack · 8 t/m²', rate: 6300, avail: 70, img: 'assets/img/dock.jpg', pos: '30% 60%' },
    { id: 'XD-03', name: 'Cross-dock lane', cat: 'Bulk', size: '3 dock doors', spec: 'Staging · 24 h dwell', rate: 3100, avail: 33, img: 'assets/img/dock.jpg', pos: '75% 50%' },
    { id: 'YD-20', name: 'Yard & trailer bays', cat: 'Bulk', size: '20 bays', spec: 'Gated · lit · monitored', rate: 1800, avail: 80, img: 'assets/img/exterior.jpg', pos: '50% 60%' }
  ];

  /* ---------- Helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const money = new Intl.NumberFormat(CONFIG.locale, { style: 'currency', currency: CONFIG.currency, maximumFractionDigits: 0 });
  const fmt = n => money.format(Math.round(n));

  const toastEl = $('#toast');
  let toastTimer;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  };

  /* ---------- Preloader ---------- */
  const loader = $('#loader');
  const finishLoad = () => {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    setTimeout(() => loader.remove(), 1400);
  };
  if (reduced) {
    finishLoad();
  } else {
    document.body.classList.add('is-loading');
    const countEl = $('#loaderCount'), barEl = $('#loaderBar');
    const heroImg = $('.hero__media img');
    let imgReady = heroImg.complete;
    heroImg.addEventListener('load', () => (imgReady = true));
    heroImg.addEventListener('error', () => (imgReady = true));
    const t0 = performance.now(), DUR = 1500, MAX = 4000;
    const tick = now => {
      const el = now - t0;
      let p = clamp(el / DUR);
      if (!imgReady && el < MAX) p = Math.min(p, 0.9);
      const v = Math.round(p * 100);
      countEl.textContent = v;
      barEl.style.width = v + '%';
      if (p < 1) requestAnimationFrame(tick); else setTimeout(finishLoad, 200);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Reveal on scroll ---------- */
  $$('[data-delay]').forEach(el => el.style.setProperty('--d', el.dataset.delay));
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.matches('.stat')) countUp($('b', e.target));
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  const observeReveals = root => $$('.reveal, .reveal-img', root).forEach(el => revealIO.observe(el));
  observeReveals(document);

  function countUp(el) {
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '';
    const show = v => (el.textContent = v.toLocaleString(CONFIG.locale, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf);
    if (reduced) return show(target);
    const t0 = performance.now(), dur = 1800;
    const step = now => {
      const p = clamp((now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      show(target * e);
      if (p < 1) requestAnimationFrame(step); else show(target);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Statement: word-by-word ---------- */
  const statement = $('#statement');
  const words = statement.textContent.trim().split(/\s+/);
  statement.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'w'; s.textContent = w;
    statement.append(s, i < words.length - 1 ? ' ' : '');
  });
  const wordEls = $$('.w', statement);

  /* ---------- Navigation ---------- */
  const nav = $('#nav'), navLinks = $('#navLinks'), navToggle = $('#navToggle');
  const setMenu = open => {
    navLinks.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
  navLinks.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      $$('a', navLinks).forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sectionIO.observe(s));

  /* ---------- Cursor ---------- */
  const cursor = $('#cursor');
  let cx = -100, cy = -100, tx = -100, ty = -100;
  if (finePointer && !reduced) {
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener('mouseover', e => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, .zone, .option, .check, input[type=range], .slide'));
    });
  }

  /* ---------- 3D tilt + spotlight ---------- */
  if (finePointer && !reduced) {
    document.addEventListener('mousemove', e => {
      const el = e.target.closest && e.target.closest('.tilt');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', px * 100 + '%');
      el.style.setProperty('--my', py * 100 + '%');
      el.style.transition = 'transform .2s ease-out';
      el.style.transform = `rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 6}deg) translateZ(0)`;
      el.style.zIndex = 2;
    }, { passive: true });
    $$('.tilt').forEach(el => el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .9s cubic-bezier(.2,.7,.1,1)';
      el.style.transform = '';
      el.style.zIndex = '';
    }));
  }

  /* ---------- Facility plan ---------- */
  const panel = $('#planPanel'), tabs = $('#zoneTabs');
  const zoneEls = $$('.zone');
  Object.entries(ZONES).forEach(([key, z]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.zone = key; b.textContent = z.title;
    b.setAttribute('role', 'tab');
    tabs.append(b);
  });
  let swapTimer;
  const fillZone = key => {
    const z = ZONES[key];
    $('#zoneTag').textContent = z.tag;
    $('#zoneTitle').textContent = z.title;
    $('#zoneText').textContent = z.text;
    const img = $('#zoneImg'); img.src = z.img; img.alt = z.title;
    const dl = $('#zoneSpecs'); dl.textContent = '';
    z.specs.forEach(([k, v]) => {
      const d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k; dd.textContent = v; d.append(dt, dd); dl.append(d);
    });
  };
  const selectZone = (key, instant) => {
    if (!ZONES[key]) return;
    zoneEls.forEach(el => {
      const on = el.dataset.zone === key;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', String(on));
    });
    $$('.chip', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.zone === key)));
    clearTimeout(swapTimer);
    if (instant || reduced) return fillZone(key);
    panel.classList.add('is-swap');
    swapTimer = setTimeout(() => { fillZone(key); panel.classList.remove('is-swap'); }, 300);
  };
  zoneEls.forEach(el => {
    el.addEventListener('click', () => selectZone(el.dataset.zone));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectZone(el.dataset.zone); }
    });
  });
  tabs.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) selectZone(b.dataset.zone); });
  selectZone('highbay', true);

  /* ---------- Inventory ---------- */
  const grid = $('#invGrid'), chips = $('#chips'), invEmpty = $('#invEmpty');
  const selected = new Set();
  let activeCat = 'All', query = '';

  ['All', ...new Set(UNITS.map(u => u.cat))].forEach(cat => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = cat; b.dataset.cat = cat;
    b.setAttribute('aria-pressed', String(cat === 'All'));
    chips.append(b);
  });

  grid.innerHTML = UNITS.map((u, i) => `
    <article class="unit reveal" data-id="${u.id}" style="--d:${i % 3}">
      <div class="unit__img"><img src="${u.img}" alt="" loading="lazy" style="object-position:${u.pos}"><span class="unit__tag">${u.cat}</span></div>
      <div class="unit__body">
        <span class="unit__code">${u.id}</span>
        <h3>${u.name}</h3>
        <div class="unit__specs"><div><span>Size</span>${u.size}</div><div><span>Specification</span>${u.spec}</div></div>
        <div class="meter">
          <div class="meter__row"><span>Available</span><b>${u.avail}%</b></div>
          <div class="meter__bar"><i data-w="${u.avail}"></i></div>
        </div>
        <div class="unit__foot">
          <span class="unit__price">${fmt(u.rate)}<small>/ month</small></span>
          <button type="button" class="unit__add" aria-pressed="false" data-add="${u.id}">Add to quote</button>
        </div>
      </div>
    </article>`).join('');
  observeReveals(grid);
  const meterIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; meterIO.unobserve(e.target); }
  }), { threshold: 0.5 });
  $$('.meter__bar i', grid).forEach(el => meterIO.observe(el));

  const applyFilter = () => {
    let shown = 0;
    UNITS.forEach(u => {
      const hay = `${u.id} ${u.name} ${u.cat} ${u.size} ${u.spec}`.toLowerCase();
      const ok = (activeCat === 'All' || u.cat === activeCat) && hay.includes(query);
      $(`.unit[data-id="${u.id}"]`, grid).hidden = !ok;
      if (ok) shown++;
    });
    invEmpty.hidden = shown > 0;
  };
  chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    activeCat = b.dataset.cat;
    $$('.chip', chips).forEach(c => c.setAttribute('aria-pressed', String(c === b)));
    applyFilter();
  });
  $('#invSearch').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); applyFilter(); });

  const navCount = $('#navCount'), selectedBox = $('#selectedUnits'), selectedList = $('#selectedList');
  const syncSelected = () => {
    $$('[data-add]', grid).forEach(b => {
      const on = selected.has(b.dataset.add);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? 'Added ✓' : 'Add to quote';
    });
    navCount.hidden = selected.size === 0;
    navCount.textContent = selected.size;
    selectedBox.hidden = selected.size === 0;
    selectedList.textContent = '';
    UNITS.filter(u => selected.has(u.id)).forEach(u => {
      const li = document.createElement('li'), s = document.createElement('span'), b = document.createElement('button');
      s.textContent = `${u.name} (${u.id}) — ${fmt(u.rate)} / month`;
      b.type = 'button'; b.textContent = 'Remove'; b.dataset.remove = u.id;
      li.append(s, b); selectedList.append(li);
    });
    updateEstimate();
  };
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const id = b.dataset.add;
    if (selected.has(id)) { selected.delete(id); toast('Removed from your quote'); }
    else { selected.add(id); toast('Added to your quote request'); }
    syncSelected();
  });
  selectedList.addEventListener('click', e => {
    const b = e.target.closest('[data-remove]'); if (!b) return;
    selected.delete(b.dataset.remove); syncSelected();
  });

  /* ---------- Quote form ---------- */
  const form = $('#quoteForm');
  const stepEls = $$('.step', form), stepDots = $$('.form__steps li', form);
  const prevBtn = $('#prevBtn'), nextBtn = $('#nextBtn'), submitBtn = $('#submitBtn');
  const pallets = $('#pallets'), months = $('#months');
  let step = 0, lastQuote = null;

  $('#addonOptions').innerHTML = CONFIG.addons.map(a =>
    `<label class="check"><input type="checkbox" name="addon" value="${a.id}"><span>${a.label}</span></label>`).join('');

  const startInput = $('#start');
  const today = new Date();
  startInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const pickDiscount = (table, v) => { const row = table.find(([min]) => v >= min); return row ? row[1] : 0; };

  function calcEstimate() {
    const fd = new FormData(form);
    const service = fd.get('service') || 'storage';
    const p = +pallets.value, m = +months.value;
    const lines = [];
    const base = p * CONFIG.ratePerPallet[service];
    lines.push([`${CONFIG.serviceLabel[service]} · ${p.toLocaleString(CONFIG.locale)} pallets`, base]);
    const disc = 1 - (1 - pickDiscount(CONFIG.volumeDiscount, p)) * (1 - pickDiscount(CONFIG.termDiscount, m));
    if (disc > 0) lines.push([`Volume & term saving (${Math.round(disc * 100)}%)`, -base * disc]);
    const net = base * (1 - disc);
    const chosen = fd.getAll('addon');
    CONFIG.addons.filter(a => chosen.includes(a.id)).forEach(a => {
      const v = a.flat ? a.flat : a.perPallet ? a.perPallet * p : net * a.pct;
      lines.push([a.label, v]);
    });
    UNITS.filter(u => selected.has(u.id)).forEach(u => lines.push([`${u.name} (${u.id})`, u.rate]));
    const monthly = lines.reduce((s, l) => s + l[1], 0);
    return { service, pallets: p, months: m, lines, monthly, total: monthly * m };
  }

  function updateEstimate() {
    const est = calcEstimate();
    $('#estMonthly').textContent = fmt(est.monthly);
    $('#estMonths').textContent = est.months;
    $('#estTotal').textContent = fmt(est.total);
    const ul = $('#estLines'); ul.textContent = '';
    est.lines.forEach(([label, v]) => {
      const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span');
      a.textContent = label; b.textContent = (v < 0 ? '− ' : '') + fmt(Math.abs(v));
      li.append(a, b); ul.append(li);
    });
    $('#palletsOut').textContent = est.pallets.toLocaleString(CONFIG.locale);
    $('#monthsOut').textContent = est.months + (est.months === 1 ? ' month' : ' months');
    [pallets, months].forEach(r => r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min)) * 100 + '%'));
  }
  form.addEventListener('input', updateEstimate);
  form.addEventListener('change', updateEstimate);

  const showStep = (n, focus) => {
    step = clamp(n, 0, stepEls.length - 1);
    stepEls.forEach((el, i) => el.classList.toggle('is-active', i === step));
    stepDots.forEach((el, i) => { el.classList.toggle('is-active', i === step); el.classList.toggle('is-past', i < step); });
    prevBtn.hidden = step === 0;
    nextBtn.hidden = step === stepEls.length - 1;
    submitBtn.hidden = step !== stepEls.length - 1;
    if (focus) { const f = $('input, textarea', stepEls[step]); if (f) f.focus({ preventScroll: true }); }
  };
  nextBtn.addEventListener('click', () => showStep(step + 1, true));
  prevBtn.addEventListener('click', () => showStep(step - 1, true));
  // Enter in a text field should advance, not submit early
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && step < stepEls.length - 1) { e.preventDefault(); showStep(step + 1, true); }
  });

  // "Get a quote" links on service cards pre-select the service
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-service]'); if (!a) return;
    const radio = $(`input[name="service"][value="${a.dataset.service}"]`, form);
    if (radio) { radio.checked = true; if (form.classList.contains('is-done')) resetForm(); showStep(0); updateEstimate(); }
  });

  const setErr = (input, msg) => {
    const wrap = input.closest('.field, .consent');
    wrap.classList.toggle('is-invalid', !!msg);
    const err = $('.err', wrap); if (err) err.textContent = msg || '';
    input.setAttribute('aria-invalid', String(!!msg));
  };
  const validate = () => {
    const name = form.elements.name, email = form.elements.email, consent = form.elements.consent;
    const errs = [];
    const check = (input, bad, msg) => { setErr(input, bad ? msg : ''); if (bad) errs.push(input); };
    check(name, name.value.trim().length < 2, 'Please enter your name.');
    check(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()), 'Please enter a valid email address.');
    check(consent, !consent.checked, 'Please confirm so we can reply to you.');
    if (errs[0]) errs[0].focus();
    return errs.length === 0;
  };
  ['name', 'email', 'consent'].forEach(n => form.elements[n].addEventListener('input', () => setErr(form.elements[n], '')));

  const buildSummary = q => [
    `Quote request ${q.ref}`,
    `Date: ${q.date}`,
    '',
    `Name: ${q.name}`,
    `Company: ${q.company || '—'}`,
    `Email: ${q.email}`,
    `Phone: ${q.phone || '—'}`,
    '',
    `Service: ${CONFIG.serviceLabel[q.service]}`,
    `Pallet positions: ${q.pallets}`,
    `Duration: ${q.months} month(s)`,
    `Preferred start: ${q.start || '—'}`,
    `Goods: ${q.goods || '—'}`,
    '',
    'Indicative estimate:',
    ...q.lines.map(([l, v]) => `  ${l}: ${v < 0 ? '-' : ''}${fmt(Math.abs(v))}`),
    `  Monthly: ${fmt(q.monthly)}`,
    `  Term total: ${fmt(q.total)}`,
    '',
    `Notes: ${q.message || '—'}`
  ].join('\n');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (step !== stepEls.length - 1) return showStep(step + 1, true);
    if (!validate()) return;
    const fd = new FormData(form), est = calcEstimate(), d = new Date();
    const stamp = d.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
    lastQuote = {
      ref: `LW-${stamp}-${rand}`, date: d.toLocaleString(CONFIG.locale),
      name: fd.get('name').trim(), company: fd.get('company').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim(),
      start: fd.get('start'), goods: fd.get('goods').trim(), message: fd.get('message').trim(), ...est
    };
    try {
      const all = JSON.parse(localStorage.getItem('lw-quotes') || '[]');
      all.push(lastQuote); localStorage.setItem('lw-quotes', JSON.stringify(all));
    } catch (_) { /* storage unavailable — the request can still be emailed or downloaded */ }
    $('#doneRef').textContent = lastQuote.ref;
    $('#doneMail').href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Quote request ' + lastQuote.ref)}&body=${encodeURIComponent(buildSummary(lastQuote))}`;
    form.classList.add('is-done');
    const done = $('#done'); done.hidden = false; done.focus({ preventScroll: true });
  });

  $('#doneSave').addEventListener('click', () => {
    if (!lastQuote) return;
    const url = URL.createObjectURL(new Blob([buildSummary(lastQuote)], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${lastQuote.ref}.txt`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  function resetForm() {
    form.reset(); selected.clear(); lastQuote = null;
    form.classList.remove('is-done'); $('#done').hidden = true;
    showStep(0); syncSelected();
  }
  $('#doneReset').addEventListener('click', resetForm);

  showStep(0);
  syncSelected();

  /* ---------- Scroll-driven animation loop ---------- */
  const progressBar = $('#progress');
  const parallaxEls = $$('[data-parallax]').map(el => ({ el, host: el.parentElement, speed: parseFloat(el.dataset.parallax), y: 0 }));
  const aboutImg = $('.about__img img');
  const stepsEl = $('#steps');
  const gallery = $('#gallery'), galTrack = $('#galTrack'), galNow = $('#galNow');
  const slides = $$('.slide', galTrack);
  let galDist = 0, galX = 0, galNative = false;
  let lastY = window.scrollY, vh = window.innerHeight;

  const layout = () => {
    vh = window.innerHeight;
    galNative = reduced || !finePointer || window.innerWidth < 900;
    gallery.classList.toggle('is-native', galNative);
    if (galNative) {
      gallery.style.height = ''; galTrack.style.transform = '';
    } else {
      galDist = Math.max(0, galTrack.scrollWidth - window.innerWidth);
      gallery.style.height = vh + galDist + 'px';
    }
  };
  layout();
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const frame = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - vh;
    progressBar.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;

    // cursor
    if (finePointer && !reduced) {
      cx = lerp(cx, tx, 0.22); cy = lerp(cy, ty, 0.22);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    }

    if (!reduced) {
      // parallax layers
      parallaxEls.forEach(p => {
        const r = p.host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const target = -(r.top + r.height / 2 - vh / 2) * p.speed;
        p.y = lerp(p.y, target, 0.12);
        p.el.style.transform = `translate3d(0, ${p.y.toFixed(2)}px, 0)`;
      });
      // image drifting inside its frame
      const ar = aboutImg.parentElement.getBoundingClientRect();
      if (ar.bottom > 0 && ar.top < vh) {
        const p = clamp((vh - ar.top) / (vh + ar.height));
        aboutImg.style.transform = `translate3d(0, ${(-p * ar.height * 0.18).toFixed(2)}px, 0)`;
      }
      // statement words
      const sr = statement.getBoundingClientRect();
      if (sr.bottom > -100 && sr.top < vh + 100) {
        const p = clamp((vh * 0.85 - sr.top) / (sr.height + vh * 0.3));
        const n = Math.ceil(p * wordEls.length);
        wordEls.forEach((w, i) => w.classList.toggle('on', i < n));
      }
    }

    // process line
    const pr = stepsEl.getBoundingClientRect();
    stepsEl.style.setProperty('--p', reduced ? 1 : clamp((vh * 0.8 - pr.top) / (vh * 0.5)).toFixed(3));

    // horizontal gallery
    const gr = gallery.getBoundingClientRect();
    if (gr.bottom > 0 && gr.top < vh) {
      if (!galNative) {
        const span = gr.height - vh;
        const target = span > 0 ? clamp(-gr.top / span) * galDist : 0;
        galX = lerp(galX, target, 0.1);
        if (Math.abs(galX - target) < 0.05) galX = target;
        galTrack.style.transform = `translate3d(${-galX.toFixed(2)}px, 0, 0)`;
      }
      const mid = window.innerWidth / 2;
      let best = 0, bestD = Infinity;
      slides.forEach((s, i) => {
        const r = s.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      galNow.textContent = String(best + 1).padStart(2, '0');
    }

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  $('#year').textContent = new Date().getFullYear();
})();
