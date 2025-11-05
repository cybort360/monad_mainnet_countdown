const targetUTC = Date.UTC(2025, 10, 24, 14, 0, 0); // months are 0-indexed: 10 -> November

const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minsEl = document.getElementById('minutes');
const secsEl = document.getElementById('seconds');
const statusText = document.getElementById('statusText');
const localTime = document.getElementById('localTime');
const progressBar = document.getElementById('progressBar');

// initial display of local target time
const localTarget = new Date(targetUTC);
localTime.textContent = `Local target: ${localTarget.toString()}`;

const pageLoadedAt = Date.now();
const totalSpan = Math.max(1, targetUTC - pageLoadedAt);

let compact = false;

function pad(n) {
  return n.toString().padStart(2, '0');
}

function update() {
  const now = Date.now();
  let diff = targetUTC - now;
  if (diff <= 0) {
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minsEl.textContent = '00';
    secsEl.textContent = '00';
    statusText.textContent = "It's time — the countdown has finished.";
    progressBar.style.width = '100%';
    triggerConfetti();
    clearInterval(timer);
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= d * (1000 * 60 * 60 * 24);
  const h = Math.floor(diff / (1000 * 60 * 60));
  diff -= h * (1000 * 60 * 60);
  const m = Math.floor(diff / (1000 * 60));
  diff -= m * (1000 * 60);
  const s = Math.floor(diff / 1000);

  daysEl.textContent = pad(d);
  hoursEl.textContent = pad(h);
  minsEl.textContent = pad(m);
  secsEl.textContent = pad(s);

  const elapsed = Date.now() - pageLoadedAt;
  const pct = Math.min(1, Math.max(0, elapsed / totalSpan));
  progressBar.style.width = pct * 100 + '%';
}

const timer = setInterval(update, 250);
update();

const confettiCanvas = document.getElementById('confetti');
const ctx = confettiCanvas.getContext && confettiCanvas.getContext('2d');
let confettiItems = [];
function resizeCanvas() {
  confettiCanvas.width = confettiCanvas.clientWidth * devicePixelRatio;
  confettiCanvas.height = confettiCanvas.clientHeight * devicePixelRatio;
  if (ctx) ctx.scale(devicePixelRatio, devicePixelRatio);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function triggerConfetti() {
  if (!ctx) return;
  // spawn 120 pieces
  confettiItems = [];
  const w = confettiCanvas.clientWidth;
  const h = confettiCanvas.clientHeight;
  for (let i = 0; i < 120; i++) {
    confettiItems.push({
      x: Math.random() * w,
      y: -10 - (Math.random() * h) / 2,
      vx: (Math.random() - 0.5) * 3,
      vy: 1 + Math.random() * 6,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      size: 6 + Math.random() * 10,
      color: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`,
    });
  }
  let frames = 0;
  function step() {
    frames++;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    const scale = devicePixelRatio;
    confettiItems.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06; // gravity
      p.rot += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    confettiItems = confettiItems.filter((p) => p.y < confettiCanvas.clientHeight + 50);
    if (confettiItems.length > 0 && frames < 200) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
  requestAnimationFrame(step);
}

// controls
document.getElementById('copyBtn').addEventListener('click', async () => {
  try {
    const url = window.location.href.split('#')[0] + '#target=2025-11-24T14:00:00Z';
    await navigator.clipboard.writeText(url);
    statusText.textContent = 'Share link copied to clipboard.';
  } catch (e) {
    statusText.textContent = 'Could not copy — permission denied.';
  }
});

document.getElementById('toggleFormat').addEventListener('click', () => {
  compact = !compact;
  const units = document.querySelectorAll('.unit .value');
  units.forEach((u) => (u.style.fontSize = compact ? '20px' : '36px'));
});

document.getElementById('resetBtn').addEventListener('click', () => {
  statusText.textContent = 'Recalculating...';
  progressBar.style.width = progressBar.style.width;
  setTimeout(
    () =>
      (statusText.textContent =
        "Counting down to the big moment. Your browser's clock is used — make sure it's accurate."),
    900
  );
});

// If page opened after the target, immediately show finished state
if (Date.now() >= targetUTC) {
  daysEl.textContent = '00';
  hoursEl.textContent = '00';
  minsEl.textContent = '00';
  secsEl.textContent = '00';
  statusText.textContent = 'The target time (24 Nov 2025, 14:00 UTC) has already passed.';
  progressBar.style.width = '100%';
  // still play confetti once if you want
  // triggerConfetti();
  clearInterval(timer);
}

// accessibility: announce when zero
const liveRegion = document.getElementById('countdown');
const observer = new MutationObserver((mut) => {
  // when seconds value updates to 00 and minutes/hours/days are zero, ensure it's announced
  const s = secsEl.textContent;
  if (s === '00' && daysEl.textContent === '00' && hoursEl.textContent === '00' && minsEl.textContent === '00') {
    liveRegion.setAttribute('aria-label', 'Event time reached');
  }
});
observer.observe(secsEl, { childList: true, characterData: true, subtree: true });
