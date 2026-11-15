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

/* FAQ + scripted assistant (same content, single source) */
(() => {
  const LI = '<a href="https://www.linkedin.com/in/enriquepalacios24/" target="_blank" rel="noopener">LinkedIn</a>';
  const QA = [
    { q: ['¿Estás disponible para nuevas oportunidades?', 'Are you open to new opportunities?'], s: ['¿Estás disponible?', 'Are you available?'],
      a: ['Sí, estoy abierto a conversar sobre roles de ML Engineer, MLOps, GenAI y Data Science, y a proyectos como consultor. <a href="#contact">Escríbeme</a>.', 'Yes, I am open to talking about ML Engineer, MLOps, GenAI and Data Science roles, and consulting projects. <a href="#contact">Write to me</a>.'] },
    { q: ['¿Desde dónde trabajas y en qué zona horaria?', 'Where are you based and what time zone?'], s: ['Zona horaria', 'Time zone'],
      a: ['Vivo en Lima, Perú (UTC−5, sin cambio de horario). Trabajo cómodo con equipos de Latinoamérica y Norteamérica.', 'I am in Lima, Peru (UTC−5, no daylight saving). I work comfortably with teams across Latin America and North America.'] },
    { q: ['¿Remoto, híbrido o presencial?', 'Remote, hybrid or on-site?'], s: ['Remoto o híbrido', 'Remote or hybrid'],
      a: ['Remoto o híbrido en Lima. Hoy trabajo en modalidad híbrida y tengo experiencia en equipos remotos.', 'Remote or hybrid in Lima. I currently work hybrid and I have experience on remote teams.'] },
    { q: ['¿En qué industrias has trabajado?', 'Which industries have you worked in?'], s: ['Industrias', 'Industries'],
      a: ['Telecomunicaciones (Entel), seguros (Pacífico Seguros), banca (análisis de crédito), educación (LIIDIA Lab) e inmobiliario (Golz).', 'Telecom (Entel), insurance (Pacífico Seguros), banking (credit analysis), education (LIIDIA Lab) and real estate (Golz).'] },
    { q: ['¿Con qué stack trabajas?', 'What stack do you work with?'], s: ['Stack', 'Stack'],
      a: ['Python, SQL, scikit-learn, PyTorch, Spark, Databricks, MLflow, Airflow, Docker, Azure y AWS; para GenAI, LangChain y LangGraph. Mira las <a href="#skills">skills</a>.', 'Python, SQL, scikit-learn, PyTorch, Spark, Databricks, MLflow, Airflow, Docker, Azure and AWS; for GenAI, LangChain and LangGraph. See the <a href="#skills">skills</a>.'] },
    { q: ['¿Cómo te contacto?', 'How can I reach you?'], s: ['Contacto', 'Contact'],
      a: [`Usa el <a href="#contact">formulario</a>, escríbeme por ${LI} o por correo. Respondo normalmente en 1 o 2 días.`, `Use the <a href="#contact">form</a>, message me on ${LI} or email. I usually reply within 1–2 days.`] }
  ];
  const EXTRA = [
    { s: ['Experiencia', 'Experience'],
      a: ['Hoy soy Machine Learning Engineer en Entel (desde sep 2025). Antes fui Data Analyst y Data Scientist Trainee en Pacífico Seguros. Mira la <a href="#experience">experiencia</a>.', 'I am a Machine Learning Engineer at Entel (since Sep 2025). Before that I was a Data Analyst and Data Scientist Trainee at Pacífico Seguros. See the <a href="#experience">experience</a>.'] },
    { s: ['Proyectos', 'Projects'],
      a: ['Tengo 3 sitios en vivo (LIIDIA Lab, Golz Real Estate, Rokkan Concret) y proyectos de MLOps, deep learning y data engineering en <a href="#projects">Proyectos</a>.', 'I have 3 live sites (LIIDIA Lab, Golz Real Estate, Rokkan Concret) plus MLOps, deep learning and data engineering projects in <a href="#projects">Projects</a>.'] },
    { s: ['Descargar CV', 'Download CV'],
      a: ['Puedes descargarlo con el botón <b>Descargar CV</b> de la <a href="#top">parte superior</a>.', 'You can get it with the <b>Download CV</b> button at the <a href="#top">top</a>.'] }
  ];
  const en = () => document.documentElement.lang === 'en';
  const L = a => a[en() ? 1 : 0];
  const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  /* FAQ accordion */
  $('#faqList').innerHTML = QA.map((x, i) =>
    `<details${i ? '' : ' open'}><summary data-es="${attr(x.q[0])}" data-en="${attr(x.q[1])}">${x.q[0]}</summary><p data-es="${attr(x.a[0])}" data-en="${attr(x.a[1])}">${x.a[0]}</p></details>`).join('');
  setLang(document.documentElement.lang);

  /* chat */
  const fab = $('#chatFab'), box = $('#chat'), log = $('#chatLog'), qs = $('#chatQ');
  const all = [...EXTRA, ...QA];
  const add = (cls, html) => { const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; };
  const start = () => {
    log.innerHTML = '';
    add('bot', en() ? 'Hi! I am Enrique\'s quick assistant. Pick a question:' : '¡Hola! Soy el asistente rápido de Enrique. Elige una pregunta:');
    qs.innerHTML = all.map((x, i) => `<button data-i="${i}">${L(x.s)}</button>`).join('');
  };
  let started = false;
  const open = v => {
    box.hidden = !v; fab.setAttribute('aria-expanded', v);
    if (v && !started) { started = true; start(); }
  };
  fab.addEventListener('click', () => open(box.hidden));
  $('#chatX').addEventListener('click', () => open(false));
  qs.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const x = all[+b.dataset.i];
    add('me', L(x.s));
    setTimeout(() => add('bot', L(x.a)), 250);
  });
  log.addEventListener('click', e => { if (e.target.closest('a[href^="#"]') && innerWidth < 560) open(false); });
  langBtn.addEventListener('click', () => setTimeout(() => { if (started) start(); }, 0));
})();
