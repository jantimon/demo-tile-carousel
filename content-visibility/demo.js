// Scaffolding only: builds the grid and measures it.
// The carousels themselves stay pure CSS — nothing here drives a dot.

const params = new URLSearchParams(location.search);
const TILES = +params.get('tiles') || 80;
const MAX_SLIDES = +params.get('slides') || 15;
const GUESS = params.get('guess') || '200px';

const WORDS = ['Compact', 'Stainless', 'Freestanding', 'Energy-saving', 'Wide',
  'Built-in', 'Quiet', 'Family-size', 'Premium', 'Slimline'];
const NOUNS = ['Dishwasher', 'Fridge Freezer', 'Washing Machine', 'Oven', 'Tumble Dryer'];
const GRADES = [['A', '#0a8f3c'], ['B', '#5cb800'], ['C', '#f5d000'], ['D', '#f08000'], ['E', '#e02020']];
const SWATCH = ['#222', '#c9c9c9', '#8b5a2b', '#1f4e79', '#a01c2c', '#f0e8d8'];

// Deterministic so the layout is identical across cv on/off comparisons.
const at = (i, n) => (i * 2654435761 % 4294967296) % n;

function tile(i) {
  const slides = 3 + at(i, MAX_SLIDES - 2);
  const titleWords = 2 + at(i + 7, 5);
  const title = Array.from({ length: titleWords },
    (_, k) => WORDS[at(i + k, WORDS.length)]).join(' ') + ' ' + NOUNS[at(i + 3, NOUNS.length)];

  const hue = at(i, 360);
  const slideHtml = Array.from({ length: slides }, (_, k) =>
    `<li style="background:linear-gradient(135deg,hsl(${(hue + k * 12) % 360} 45% 82%),hsl(${(hue + k * 12 + 40) % 360} 45% 68%))"></li>`
  ).join('');
  const dotHtml = Array.from({ length: slides }, (_, k) =>
    `<a href="#" aria-label="Image ${k + 1}"></a>`).join('');

  // Height varies: title wraps 1-3 lines, and these two blocks come and go.
  const hasVariants = at(i + 1, 3) > 0;
  const hasEnergy = at(i + 5, 5) > 1;
  const swatches = hasVariants
    ? `<div class="variants">${Array.from({ length: 2 + at(i, 4) },
        (_, k) => `<i style="background:${SWATCH[at(i + k, SWATCH.length)]}"></i>`).join('')}</div>`
    : '';
  const [grade, colour] = GRADES[at(i + 2, GRADES.length)];
  const energy = hasEnergy ? `<span class="energy" style="background:${colour}">${grade}</span>` : '';

  return `<article class="tile">
<div class="carousel" style="--n:${slides}">
<ul class="track">${slideHtml}</ul>
<nav class="dots" aria-label="Images">${dotHtml}</nav>
</div>
<div class="body">
<p class="title">${title}</p>
${swatches}${energy}
<p class="price">CHF ${(49 + at(i, 1900)).toFixed(2)}</p>
</div>
</article>`;
}

const grid = document.querySelector('.grid');
document.documentElement.style.setProperty('--guess', GUESS);

const t0 = performance.now();
grid.innerHTML = Array.from({ length: TILES }, (_, i) => tile(i)).join('');
const genMs = Math.round(performance.now() - t0);

// ---- measurement panel ----

const out = {
  gen: document.querySelector('#gen'),
  height: document.querySelector('#height'),
  spread: document.querySelector('#spread'),
  truth: document.querySelector('#truth'),
};
let truthHeight = null;

function heights() {
  const hs = [...grid.children].map(t => Math.round(t.getBoundingClientRect().height)).sort((a, b) => a - b);
  return { min: hs[0], med: hs[hs.length >> 1], max: hs.at(-1) };
}

function measure() {
  const h = document.documentElement.scrollHeight;
  const s = heights();
  out.gen.textContent = `${TILES} tiles · ${genMs}ms build`;
  out.height.textContent = `${h}px`;
  out.spread.textContent = `${s.min}/${s.med}/${s.max}`;
  out.truth.textContent = truthHeight === null
    ? '—'
    : `${truthHeight}px (${(((h - truthHeight) / truthHeight) * 100).toFixed(1)}%)`;
}

const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

document.querySelector('#toggle').addEventListener('click', async e => {
  document.documentElement.classList.toggle('cv');
  e.target.textContent = document.documentElement.classList.contains('cv')
    ? 'content-visibility: ON' : 'content-visibility: OFF';
  await frame();
  measure();
});

// Scroll the whole page so every tile renders once and its real height is remembered.
document.querySelector('#walk').addEventListener('click', async () => {
  const y = scrollY;
  for (let p = 0; p < document.documentElement.scrollHeight; p += innerHeight) {
    scrollTo(0, p);
    await frame();
  }
  scrollTo(0, y);
  await frame();
  measure();
});

// Capture the un-contained height as the reference to compare against.
document.querySelector('#reference').addEventListener('click', async () => {
  const had = document.documentElement.classList.contains('cv');
  document.documentElement.classList.remove('cv');
  await frame();
  truthHeight = document.documentElement.scrollHeight;
  if (had) document.documentElement.classList.add('cv');
  await frame();
  measure();
});

document.documentElement.classList.add('cv');
frame().then(measure);
