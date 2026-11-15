const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};

/* language */
const langBtn = $('#langBtn');
function setLang(l) {
  document.documentElement.lang = l;
  $$('[data-es]').forEach(el => {
    const v = el.dataset[l];
    if (v != null) el.innerHTML = v;
  });
  langBtn.textContent = l === 'es' ? 'EN' : 'ES';
  store.set('lang', l);
}
langBtn.addEventListener('click', () => setLang(document.documentElement.lang === 'es' ? 'en' : 'es'));
setLang(store.get('lang') || (navigator.language.startsWith('en') ? 'en' : 'es'));

/* theme */
const root = document.documentElement;
root.dataset.theme = store.get('theme') || 'dark';
$('#themeBtn').addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  store.set('theme', root.dataset.theme);
});

/* nav */
const nav = $('#nav'), links = $('#links');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });
$('#burger').addEventListener('click', () => links.classList.toggle('open'));
$$('#links a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) $$('#links a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

/* reveal + counters */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  const c = $('[data-count]', e.target);
  if (c) countUp(c);
  io.unobserve(e.target);
}), { threshold: .15 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
function countUp(el) {
  const end = +el.dataset.count, t0 = performance.now();
  const step = t => {
    const p = Math.min(1, (t - t0) / 1100);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* skill filters */
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#filters button').forEach(x => x.classList.toggle('on', x === b));
  $$('#skillCloud span').forEach(s => s.classList.toggle('dim', b.dataset.f !== 'all' && s.dataset.c !== b.dataset.f));
});

/* Lima clock */
const clock = $('#clock');
const tick = () => clock.textContent = new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }) + ' UTC−5';
tick(); setInterval(tick, 30000);

/* contact form -> sent automatically via FormSubmit (no backend needed) */
const CONTACT_TO = 'palacios.alexis@pucp.edu.pe';
$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target, btn = $('button[type=submit]', form), status = $('#formStatus');
  const f = new FormData(form);
  if (f.get('_honey')) return;                       // spam trap
  const en = document.documentElement.lang === 'en';
  const say = (es, enTxt, ok) => { status.textContent = en ? enTxt : es; status.dataset.ok = ok ? '1' : '0'; };
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = en ? 'Sending…' : 'Enviando…';
  say('', '', true);
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_TO}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: f.get('name'), email: f.get('email'), message: f.get('msg'),
        _subject: `Portafolio: mensaje de ${f.get('name')}`,
        _replyto: f.get('email'), _template: 'table', _captcha: 'false'
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || res.status);
    form.reset();
    say('¡Mensaje enviado! Te responderé pronto.', 'Message sent! I will reply soon.', true);
  } catch (err) {
    const body = `${f.get('msg')}\n\n— ${f.get('name')} (${f.get('email')})`;
    const subj = 'Contacto desde el portafolio';
    const href = `mailto:${CONTACT_TO}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    const web = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(CONTACT_TO)}&subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    console.warn('Contact form fallback:', err);
    status.innerHTML = (en ? 'Opening your email app… If nothing opens: ' : 'Abriendo tu correo… Si no se abre: ')
      + `<a href="${href}">${en ? 'email app' : 'app de correo'}</a> · `
      + `<a href="${web}" target="_blank" rel="noopener">Outlook web</a>`;
    status.dataset.ok = '0';
    location.href = href;                       // open the default mail app (e.g. Outlook) automatically
  } finally {
    btn.disabled = false; btn.textContent = label;
  }
});

$('#year').textContent = new Date().getFullYear();

/* certificates: render, filter, show more, lightbox */
(() => {
  const LIMIT = 8;
  const grid = $('#certGrid'), btn = $('#certMore'), lb = $('#lb');
  const t = (es, en) => document.documentElement.lang === 'en' ? (en || es) : es;
  let filter = 'all', expanded = false;

  grid.innerHTML = CERTS.map((c, i) => `
    <button class="cert" data-i="${i}" data-c="${c.cat}">
      <img src="${encodeURI(c.thumb)}" alt="${c.title} — ${c.issuer}" loading="lazy" decoding="async">
      <span class="ct">
        ${c.feat ? '<span class="star">★</span>' : ''}
        <b>${c.title}</b>
        <small>${c.issuer}</small>
        ${c.es || c.en ? `<small data-es="${c.es}" data-en="${c.en}">${c.es}</small>` : ''}
      </span>
    </button>`).join('');

  function paint() {
    const all = $$('.cert', grid);
    const items = all.filter(el => filter === 'all' || el.dataset.c === filter);
    all.forEach(el => el.classList.add('hide'));
    items.forEach((el, i) => el.classList.toggle('hide', !expanded && i >= LIMIT));
    btn.hidden = items.length <= LIMIT;
    btn.textContent = expanded
      ? t('Ver menos', 'Show less')
      : t(`Ver más (${items.length - LIMIT})`, `Show more (${items.length - LIMIT})`);
  }
  $('#certFilters').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#certFilters button').forEach(x => x.classList.toggle('on', x === b));
    filter = b.dataset.f; expanded = false; paint();
  });
  btn.addEventListener('click', () => { expanded = !expanded; paint(); if (!expanded) $('#certs').scrollIntoView({ behavior: 'smooth' }); });
  langBtn.addEventListener('click', () => setTimeout(paint, 0));

  grid.addEventListener('click', e => {
    const c = e.target.closest('.cert'); if (!c) return;
    const d = CERTS[+c.dataset.i];
    $('#lbImg').src = encodeURI(d.full);
    $('#lbImg').alt = `${d.title} — ${d.issuer}`;
    $('#lbCap').textContent = `${d.title} · ${d.issuer}`;
    lb.showModal();
  });
  $('#lbX').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

  paint();
  setLang(document.documentElement.lang);
})();

/* projects: show more */
(() => {
  const grid = $('#projGrid'), btn = $('#projMore');
  const label = () => {
    const en = document.documentElement.lang === 'en', open = grid.classList.contains('open');
    const n = $$('.extra', grid).length;
    btn.textContent = open ? (en ? 'Show fewer projects' : 'Ver menos proyectos') : (en ? `Show ${n} more projects` : `Ver ${n} proyectos más`);
  };
  btn.addEventListener('click', () => {
    grid.classList.toggle('open'); label();
    if (!grid.classList.contains('open')) $('#projects').scrollIntoView({ behavior: 'smooth' });
  });
  langBtn.addEventListener('click', () => setTimeout(label, 0));
  label();
})();
