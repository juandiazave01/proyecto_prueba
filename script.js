// ============================================
// GALLERY TABS (nav dropdown + in-section pills)
// ============================================
function switchGalleryTab(tab) {
  document.querySelectorAll('.gallery-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === tab);
  });
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

document.querySelectorAll('.tab-btn, .nav-dropdown-menu a[data-tab]').forEach(el => {
  el.addEventListener('click', (e) => {
    const tab = el.dataset.tab;
    if (tab) switchGalleryTab(tab);
  });
});

// ============================================
// MOBILE MENU (hamburger toggle)
// ============================================
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('mobile-open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close the mobile menu when a real link (not a dropdown trigger) is tapped
  navLinks.querySelectorAll('a').forEach(link => {
    const isDropdownTrigger = link.parentElement.classList.contains('nav-dropdown');
    if (isDropdownTrigger) return;
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Tap-to-open dropdown on touch devices (in addition to hover on desktop)
// Handles every .nav-dropdown on the page (Reliability, Gallery, etc.)
document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
  const trigger = dropdown.querySelector(':scope > a');
  const menu = dropdown.querySelector('.nav-dropdown-menu');
  if (!trigger || !menu) return;

  trigger.addEventListener('click', (e) => {
    if (window.matchMedia('(hover: none)').matches) {
      e.preventDefault();
      menu.classList.toggle('open');
    }
  });
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-dropdown')) {
    document.querySelectorAll('.nav-dropdown-menu.open').forEach(menu => menu.classList.remove('open'));
  }
});
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================
// MTBF / MTTR / AVAILABILITY CALCULATOR
// ============================================
const mtbfRuntime = document.getElementById('mtbf-runtime');
const mtbfFailures = document.getElementById('mtbf-failures');
const mtbfDowntime = document.getElementById('mtbf-downtime');
const outMtbf = document.getElementById('out-mtbf');
const outMttr = document.getElementById('out-mttr');
const outAvailability = document.getElementById('out-availability');
const mtbfLed = document.getElementById('mtbf-led');

function calcMtbf() {
  const runtime = parseFloat(mtbfRuntime.value) || 0;
  const failures = parseFloat(mtbfFailures.value) || 0;
  const downtime = parseFloat(mtbfDowntime.value) || 0;

  if (failures <= 0 || runtime <= 0) {
    outMtbf.textContent = '—';
    outMttr.textContent = '—';
    outAvailability.textContent = '—';
    mtbfLed.classList.remove('led-on');
    return;
  }

  const upTime = Math.max(runtime - downtime, 0);
  const mtbf = upTime / failures;
  const mttr = downtime / failures;
  const availability = (mtbf / (mtbf + mttr)) * 100;

  outMtbf.textContent = mtbf.toFixed(1);
  outMttr.textContent = mttr.toFixed(2);
  outAvailability.textContent = availability.toFixed(2);

  mtbfLed.classList.add('led-on');
  mtbfLed.style.background = availability >= 90 ? 'var(--accent)' : availability >= 75 ? 'var(--amber)' : 'var(--red)';
}

[mtbfRuntime, mtbfFailures, mtbfDowntime].forEach(el => el && el.addEventListener('input', calcMtbf));
if (mtbfRuntime) calcMtbf();

// ============================================
// WEIBULL RELIABILITY R(t) CALCULATOR
// ============================================
const wbBeta = document.getElementById('wb-beta');
const wbEta = document.getElementById('wb-eta');
const wbT = document.getElementById('wb-t');
const outRt = document.getElementById('out-rt');
const wbBarFill = document.getElementById('wb-bar-fill');
const wbNote = document.getElementById('wb-note');
const weibullLed = document.getElementById('weibull-led');

function calcWeibull() {
  const beta = parseFloat(wbBeta.value);
  const eta = parseFloat(wbEta.value);
  const t = parseFloat(wbT.value);

  if (!beta || !eta || eta <= 0 || t < 0) {
    outRt.textContent = '—';
    wbBarFill.style.width = '0%';
    wbNote.textContent = '—';
    return;
  }

  const rt = Math.exp(-Math.pow(t / eta, beta)) * 100;
  outRt.textContent = rt.toFixed(2);
  wbBarFill.style.width = Math.max(0, Math.min(100, rt)) + '%';

  let zone, color;
  if (rt >= 80) { zone = 'Healthy — low failure probability at this point in life.'; color = 'var(--accent)'; }
  else if (rt >= 50) { zone = 'Watch — failure probability is becoming significant.'; color = 'var(--amber)'; }
  else { zone = 'Critical — most units are statistically expected to have failed by now.'; color = 'var(--red)'; }

  wbBarFill.style.background = color;
  weibullLed.style.background = color;
  weibullLed.style.boxShadow = `0 0 6px 1px ${color}`;

  const shapeNote = beta < 1
    ? 'β < 1: infant mortality — failure rate decreasing over time.'
    : beta === 1
    ? 'β = 1: random failures — constant failure rate (exponential).'
    : 'β > 1: wear-out — failure rate increasing over time.';

  wbNote.textContent = `${zone} ${shapeNote}`;
}

[wbBeta, wbEta, wbT].forEach(el => el && el.addEventListener('input', calcWeibull));
if (wbBeta) calcWeibull();

// ============================================
// RELIABILITY LIBRARY — pill tabs + nav dropdown links, shared panel display
// ============================================
function switchTopic(topic) {
  document.querySelectorAll('.topic-panel[data-topic]').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.topic === topic);
  });
  document.querySelectorAll('.tab-btn[data-topic]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.topic === topic);
  });
}

document.querySelectorAll('.tab-btn[data-topic], .nav-dropdown-menu a[data-topic]').forEach(el => {
  el.addEventListener('click', () => {
    const topic = el.dataset.topic;
    if (topic) switchTopic(topic);
  });
});

function switchAiTopic(topic) {
  document.querySelectorAll('.topic-panel[data-ai-topic]').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.aiTopic === topic);
  });
  document.querySelectorAll('.tab-btn[data-ai-topic]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.aiTopic === topic);
  });
}

document.querySelectorAll('.tab-btn[data-ai-topic], .nav-dropdown-menu a[data-ai-topic]').forEach(el => {
  el.addEventListener('click', () => {
    const topic = el.dataset.aiTopic;
    if (topic) switchAiTopic(topic);
  });
});


// ============================================
// EMAIL CONTACT MODAL
// ============================================
const emailModalOverlay = document.getElementById('email-modal-overlay');
const openEmailModalBtn = document.getElementById('open-email-modal');
const closeEmailModalBtn = document.getElementById('close-email-modal');
const emailForm = document.getElementById('email-form');

const CONTACT_EMAIL = 'juandiazave01@yahoo.com';

if (openEmailModalBtn && emailModalOverlay) {
  openEmailModalBtn.addEventListener('click', () => {
    emailModalOverlay.classList.add('open');
  });
}
if (closeEmailModalBtn && emailModalOverlay) {
  closeEmailModalBtn.addEventListener('click', () => {
    emailModalOverlay.classList.remove('open');
  });
}
if (emailModalOverlay) {
  emailModalOverlay.addEventListener('click', (e) => {
    if (e.target === emailModalOverlay) emailModalOverlay.classList.remove('open');
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && emailModalOverlay) emailModalOverlay.classList.remove('open');
});

if (emailForm) {
  emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const senderEmail = document.getElementById('ef-email').value.trim();
    const subject = document.getElementById('ef-subject').value.trim();
    const comment = document.getElementById('ef-comment').value.trim();

    const body = `From: ${senderEmail}\n\n${comment || '(no additional comment)'}`;
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
    emailModalOverlay.classList.remove('open');
    emailForm.reset();
  });
}
