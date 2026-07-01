// ============================================
// FOOTER YEAR
// ============================================
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================
// CAREER UPTIME COUNTER
// ============================================
const CAREER_START = new Date('1999-01-01T00:00:00');

function updateUptime() {
  const now = new Date();
  let diffMs = now - CAREER_START;
  if (diffMs < 0) diffMs = 0;

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const daysEl = document.getElementById('uptime-days');
  const clockEl = document.getElementById('uptime-clock');
  if (daysEl) daysEl.textContent = String(days).padStart(5, '0');
  if (clockEl) {
    clockEl.textContent =
      String(hours).padStart(2, '0') + ':' +
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0');
  }
}
updateUptime();
setInterval(updateUptime, 1000);

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

[mtbfRuntime, mtbfFailures, mtbfDowntime].forEach(el => el.addEventListener('input', calcMtbf));
calcMtbf();

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

[wbBeta, wbEta, wbT].forEach(el => el.addEventListener('input', calcWeibull));
calcWeibull();
