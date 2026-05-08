#!/usr/bin/env node
// build.js — read content/zazen/*.yml, generate:
//   public/zazen/<slug>/index.html
//   public/zazen/<slug>/og.png
//   public/zazen/index.html
//   public/zazen/manifest.json   (used by landing page modal)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const CONTENT    = path.join(ROOT, 'content', 'zazen');
const OUT        = path.join(ROOT, 'public',  'zazen');

const SITE_URL   = 'https://a16zee.com';
const REPO_URL   = 'https://github.com/ahoward/a16zee';

// ---------- read content -----------------------------------------------------

function readHaikus() {
  const files = fs.readdirSync(CONTENT).filter(f => f.endsWith('.yml'));
  const haikus = files.map(f => {
    const raw  = fs.readFileSync(path.join(CONTENT, f), 'utf8');
    const data = yaml.load(raw);
    if (!data.slug)   throw new Error(`${f}: missing slug`);
    if (!data.title)  throw new Error(`${f}: missing title`);
    if (!data.author) throw new Error(`${f}: missing author`);
    if (!data.body)   throw new Error(`${f}: missing body`);
    if (!data.motif)  throw new Error(`${f}: missing motif`);
    data.body  = data.body.trim();
    data.lines = data.body.split('\n');
    return data;
  });
  haikus.sort((a, b) => a.slug.localeCompare(b.slug));
  return haikus;
}

// ---------- motif library ---------------------------------------------------
// each function returns an inline svg string sized for a 1200x630 background
// the canvas left half holds the text, right half holds the motif art.

const motifs = {
  'rolled-bill': `
    <g transform="translate(740 215)">
      <rect x="0" y="0" width="380" height="120" rx="6" fill="#fff" stroke="#000" stroke-width="3"/>
      <rect x="0" y="0" width="14" height="120" fill="#000"/>
      <rect x="366" y="0" width="14" height="120" fill="#000"/>
      <circle cx="190" cy="60" r="34" fill="none" stroke="#000" stroke-width="3"/>
      <text x="190" y="68" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="30" font-weight="900" fill="#000">$1M</text>
      <text x="80"  y="66" font-family="DejaVu Sans Mono" font-size="14" fill="#000">SAFE NOTE</text>
      <text x="240" y="66" font-family="DejaVu Sans Mono" font-size="14" fill="#000">NO DECK</text>
    </g>`,
  'polaroid': `
    <g transform="translate(740 200)">
      <rect x="0" y="0" width="320" height="280" fill="#fff" stroke="#000" stroke-width="3"/>
      <rect x="20" y="20" width="280" height="200" fill="#000"/>
      <rect x="40" y="40" width="240" height="160" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="160" y="135" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="20" font-weight="700" fill="#fff">[ NO PHOTO ]</text>
      <text x="160" y="262" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="16" font-weight="700" fill="#000">~ MIAMI · '79 ~</text>
    </g>`,
  'mirror-rails': `
    <g transform="translate(720 230)">
      <rect x="0" y="0" width="420" height="180" fill="#fff" stroke="#000" stroke-width="3"/>
      <line x1="0" y1="90" x2="420" y2="90" stroke="#000" stroke-width="1" stroke-dasharray="3 3"/>
      <rect x="40"  y="50"  width="180" height="14" fill="#000"/>
      <rect x="240" y="50"  width="140" height="14" fill="#000"/>
      <rect x="40"  y="116" width="140" height="14" fill="#000"/>
      <rect x="200" y="116" width="180" height="14" fill="#000"/>
      <text x="210" y="170" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="14" fill="#000">TWO LINES · NO WAITING</text>
    </g>`,
  'ledger-paper': `
    <g transform="translate(720 200)">
      <rect x="0" y="0" width="420" height="280" fill="#fff" stroke="#000" stroke-width="3"/>
      ${Array.from({length:9},(_,i)=>`<line x1="0" y1="${30+i*28}" x2="420" y2="${30+i*28}" stroke="#000" stroke-width="0.5" stroke-dasharray="2 4"/>`).join('')}
      <line x1="60" y1="0" x2="60" y2="280" stroke="#cc0000" stroke-width="2"/>
      <text x="80"  y="60"  font-family="DejaVu Sans Mono" font-size="18" fill="#000">tam........... ∞</text>
      <text x="80"  y="92"  font-family="DejaVu Sans Mono" font-size="18" fill="#000">narrative..... pending</text>
      <text x="80"  y="124" font-family="DejaVu Sans Mono" font-size="18" fill="#000">deck.......... 0 slides</text>
      <text x="80"  y="156" font-family="DejaVu Sans Mono" font-size="18" fill="#000">moat.......... a server</text>
      <text x="80"  y="188" font-family="DejaVu Sans Mono" font-size="18" fill="#000">vibes......... 11/10</text>
      <text x="80"  y="240" font-family="DejaVu Sans Mono" font-size="22" font-weight="900" fill="#000">verdict: SHIP</text>
    </g>`,
  'stack-of-paper': `
    <g transform="translate(740 220)">
      <rect x="20" y="40" width="320" height="200" fill="#fff" stroke="#000" stroke-width="3"/>
      <rect x="14" y="30" width="320" height="200" fill="#fff" stroke="#000" stroke-width="3"/>
      <rect x="8"  y="20" width="320" height="200" fill="#fff" stroke="#000" stroke-width="3"/>
      <rect x="0"  y="10" width="320" height="200" fill="#fff" stroke="#000" stroke-width="3"/>
      <text x="160" y="80"  text-anchor="middle" font-family="DejaVu Sans Mono" font-size="22" font-weight="900" fill="#000">DECK v47</text>
      <line x1="40" y1="100" x2="280" y2="100" stroke="#000" stroke-width="1"/>
      <line x1="40" y1="120" x2="240" y2="120" stroke="#000" stroke-width="1"/>
      <line x1="40" y1="140" x2="260" y2="140" stroke="#000" stroke-width="1"/>
      <line x1="40" y1="160" x2="200" y2="160" stroke="#000" stroke-width="1"/>
      <line x1="40" y1="180" x2="240" y2="180" stroke="#000" stroke-width="1"/>
      <text x="160" y="210" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="14" fill="#000">DO NOT READ</text>
    </g>`,
  'chain-pendant': `
    <g transform="translate(740 240)" stroke="#000" stroke-width="3" fill="none">
      <ellipse cx="20"  cy="60" rx="22" ry="14"/>
      <ellipse cx="60"  cy="60" rx="22" ry="14"/>
      <ellipse cx="100" cy="60" rx="22" ry="14"/>
      <ellipse cx="140" cy="60" rx="22" ry="14"/>
      <ellipse cx="180" cy="60" rx="22" ry="14"/>
      <ellipse cx="220" cy="60" rx="22" ry="14"/>
      <ellipse cx="260" cy="60" rx="22" ry="14"/>
      <ellipse cx="300" cy="60" rx="22" ry="14"/>
      <rect x="330" y="44" width="60" height="80" fill="#000"/>
      <rect x="345" y="60" width="8"  height="48" fill="#fff"/>
      <text x="195" y="170" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="16" font-weight="700" fill="#000" stroke="none">14k · SOLID · REGRET-FREE</text>
    </g>`,
  'speech-bubble': `
    <g transform="translate(720 200)">
      <path d="M 0 0 L 420 0 L 420 200 L 100 200 L 60 260 L 60 200 L 0 200 Z" fill="#fff" stroke="#000" stroke-width="3"/>
      <text x="210" y="60"  text-anchor="middle" font-family="DejaVu Sans Mono" font-size="22" font-weight="900" fill="#000">"the future</text>
      <text x="210" y="100" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="22" font-weight="900" fill="#000">is real-time</text>
      <text x="210" y="140" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="22" font-weight="900" fill="#000">and i am the</text>
      <text x="210" y="180" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="22" font-weight="900" fill="#000">future."</text>
    </g>`,
  'calendar-grid': `
    <g transform="translate(720 200)">
      <rect x="0" y="0" width="420" height="280" fill="#fff" stroke="#000" stroke-width="3"/>
      <text x="210" y="32" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="20" font-weight="900" fill="#000">CURRICULUM · WK 1-10</text>
      ${Array.from({length:10},(_,i)=>{
        const col=i%5, row=Math.floor(i/5);
        const x=20+col*78, y=60+row*100;
        return `<rect x="${x}" y="${y}" width="70" height="90" fill="#fff" stroke="#000" stroke-width="2"/>
                <text x="${x+35}" y="${y+30}" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="14" font-weight="700" fill="#000">WK ${i+1}</text>
                <line x1="${x+10}" y1="${y+75}" x2="${x+60}" y2="${y+45}" stroke="#000" stroke-width="3"/>
                <line x1="${x+60}" y1="${y+75}" x2="${x+10}" y2="${y+45}" stroke="#000" stroke-width="3"/>`;
      }).join('')}
    </g>`,
  'parking-stripe': `
    <g transform="translate(720 220)">
      <rect x="0" y="0" width="420" height="240" fill="#222" stroke="#000" stroke-width="3"/>
      ${[40,140,240,340].map(x=>`<rect x="${x}" y="20" width="6" height="200" fill="#ffd23f"/>`).join('')}
      <rect x="60" y="80" width="80" height="120" fill="#fff" stroke="#000" stroke-width="2"/>
      <text x="100" y="148" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="18" font-weight="900" fill="#000">B</text>
      <text x="280" y="148" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="22" font-weight="900" fill="#fff">3:00 AM</text>
      <text x="280" y="180" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="14" fill="#fff">SPOT 47</text>
    </g>`,
  'gift-wrap': `
    <g transform="translate(720 200)">
      <rect x="0" y="0" width="420" height="280" fill="#fff" stroke="#000" stroke-width="3"/>
      ${Array.from({length:14},(_,i)=>`<line x1="0" y1="${20*i}" x2="420" y2="${20*i+50}" stroke="#000" stroke-width="1" stroke-dasharray="4 4"/>`).join('')}
      <rect x="0"   y="120" width="420" height="40" fill="#000"/>
      <rect x="190" y="0"   width="40"  height="280" fill="#000"/>
      <text x="210" y="148" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="22" font-weight="900" fill="#fff">"PLATFORM"</text>
    </g>`,
  'x-marks-spot': `
    <g transform="translate(740 230)">
      <rect x="0" y="0" width="380" height="220" fill="#fff" stroke="#000" stroke-width="3"/>
      <line x1="40"  y1="40"  x2="340" y2="180" stroke="#cc0000" stroke-width="14"/>
      <line x1="340" y1="40"  x2="40"  y2="180" stroke="#cc0000" stroke-width="14"/>
      <text x="190" y="112" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="32" font-weight="900" fill="#000">MID</text>
    </g>`,
  'git-graph': `
    <g transform="translate(720 220)" stroke="#000" stroke-width="3" fill="none">
      <line x1="40" y1="20" x2="40" y2="220"/>
      <line x1="120" y1="60" x2="120" y2="180"/>
      <line x1="40" y1="60"  x2="120" y2="60"/>
      <line x1="40" y1="180" x2="120" y2="180"/>
      <circle cx="40"  cy="20"  r="10" fill="#fff"/>
      <circle cx="40"  cy="60"  r="10" fill="#fff"/>
      <circle cx="120" cy="60"  r="10" fill="#fff"/>
      <circle cx="120" cy="120" r="10" fill="#fff"/>
      <circle cx="120" cy="180" r="10" fill="#fff"/>
      <circle cx="40"  cy="180" r="10" fill="#000"/>
      <circle cx="40"  cy="220" r="10" fill="#fff"/>
      <text x="180" y="64"  font-family="DejaVu Sans Mono" font-size="16" fill="#000" stroke="none">init.</text>
      <text x="180" y="124" font-family="DejaVu Sans Mono" font-size="16" fill="#000" stroke="none">wip.</text>
      <text x="180" y="184" font-family="DejaVu Sans Mono" font-size="16" fill="#000" stroke="none">merge: HEAD</text>
      <text x="180" y="224" font-family="DejaVu Sans Mono" font-size="16" fill="#000" stroke="none">push --force</text>
    </g>`,
};

// ---------- og image renderer ------------------------------------------------

function svgEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHaikuSvg(h) {
  const motif = motifs[h.motif] || motifs['rolled-bill'];
  const lines = h.lines.slice(0, 4); // safety cap
  const linesSvg = lines.map((line, i) =>
    `<text x="80" y="${300 + i * 56}" font-family="DejaVu Sans Mono" font-size="42" font-weight="700" fill="#000">${svgEscape(line)}</text>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#ffffff"/>
    <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#000" stroke-width="4"/>
    <text x="80" y="120" font-family="DejaVu Sans Mono" font-size="28" font-weight="900" fill="#000" letter-spacing="2">a16zee · zazen</text>
    <text x="1120" y="120" text-anchor="end" font-family="DejaVu Sans Mono" font-size="18" font-weight="400" fill="#000">${svgEscape(h.caption || '#vcevil')}</text>
    <line x1="80" y1="150" x2="1120" y2="150" stroke="#000" stroke-width="2"/>
    <text x="80" y="210" font-family="DejaVu Sans Mono" font-size="56" font-weight="900" fill="#000" letter-spacing="-2">${svgEscape(h.title)}</text>
    <text x="80" y="248" font-family="DejaVu Sans Mono" font-size="20" font-weight="400" fill="#000">— ${svgEscape(h.author)}</text>
    ${linesSvg}
    <text x="80" y="555" font-family="DejaVu Sans Mono" font-size="18" font-weight="700" fill="#000">a16zee.com / zazen / ${svgEscape(h.slug)}</text>
    <text x="1120" y="555" text-anchor="end" font-family="DejaVu Sans Mono" font-size="18" font-weight="400" fill="#000">#vcevil</text>
    ${motif}
  </svg>`;
}

async function renderOgPng(h, outPath) {
  const svg = renderHaikuSvg(h);
  const buf = Buffer.from(svg, 'utf8');
  await sharp(buf).resize(1200, 630).png().toFile(outPath);
}

// ---------- html templates ---------------------------------------------------

const SHARED_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;color:#000;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;line-height:1.5}
body{padding:24px 24px 80px;max-width:780px;margin:0 auto}
header{border-bottom:1px solid #000;padding-bottom:12px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
h1{font-size:28px;font-weight:700;letter-spacing:-1px}
h1 a{color:inherit;text-decoration:none}
h1 a:hover{text-decoration:underline}
h1 span{font-weight:400}
.tag{font-size:12px;text-transform:uppercase}
h2{font-size:16px;font-weight:700;text-transform:uppercase;margin:24px 0 8px;border-bottom:1px solid #000;padding-bottom:4px}
.crumb{font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.crumb a{color:#000}
.haiku{margin:32px 0;padding:24px;border:1px solid #000;font-size:24px;line-height:1.7;font-weight:700;white-space:pre-wrap}
.byline{margin:0 0 24px;font-size:14px}
.byline em{font-style:normal;text-decoration:underline}
.preview{display:block;margin:24px 0;border:1px solid #000;width:100%;height:auto}
.list{list-style:none;padding:0}
.list li{border-bottom:1px solid #000;padding:14px 0;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:baseline}
.list li:last-child{border-bottom:0}
.list .num{font-size:11px;font-weight:700;letter-spacing:1px}
.list .ttl a{font-size:18px;font-weight:700;color:#000;text-decoration:none}
.list .ttl a:hover{text-decoration:underline}
.list .auth{font-size:12px;text-align:right}
.cta{margin:32px 0;padding:14px;border:1px dashed #000;font-size:13px}
.cta a{color:#000;font-weight:700}
hr{border:0;border-top:1px solid #000;margin:24px 0}
footer{position:fixed;bottom:6px;left:0;right:0;padding:0 8px;display:flex;justify-content:space-between;pointer-events:none}
footer a,footer span{pointer-events:auto}
.real-tech{font-size:8px;color:#000;text-decoration:underline}
.disclaimer{opacity:.01;font-size:8px}
`;

function htmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function permalinkPage(h) {
  const url = `${SITE_URL}/zazen/${h.slug}/`;
  const ogImg = `${SITE_URL}/zazen/${h.slug}/og.png`;
  const desc = h.body.replace(/\n/g, ' / ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${htmlEscape(h.title)} — Zazen by ${htmlEscape(h.author)} · a16zee</title>
<meta name="description" content="${htmlEscape(desc)}">

<link rel="canonical" href="${url}">
<meta name="theme-color" content="#ffffff">

<meta property="og:type" content="article">
<meta property="og:site_name" content="a16zee">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Zazen by ${htmlEscape(h.author)}">
<meta property="og:description" content="${htmlEscape(desc)}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:secure_url" content="${ogImg}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${htmlEscape(h.title)} — by ${htmlEscape(h.author)}">
<meta property="article:author" content="${htmlEscape(h.author)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@drawohara">
<meta name="twitter:title" content="Zazen by ${htmlEscape(h.author)}">
<meta name="twitter:description" content="${htmlEscape(desc)}">
<meta name="twitter:image" content="${ogImg}">

<style>${SHARED_CSS}</style>
</head>
<body>
  <header>
    <h1><a href="/">a16zee</a> <span>// zazen</span></h1>
    <div class="tag">#vcevil</div>
  </header>

  <p class="crumb"><a href="/zazen/">← all zazen</a></p>

  <h2>${htmlEscape(h.title)}</h2>
  <p class="byline">— Zazen by <em>${htmlEscape(h.author)}</em></p>

  <pre class="haiku">${htmlEscape(h.body)}</pre>

  <img class="preview" src="og.png" alt="${htmlEscape(h.title)} — visual exhibit">

  <div class="cta">
    have your own zazen?
    <a href="${REPO_URL}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">open a pr →</a>
    or
    <a href="${REPO_URL}/issues/new?title=zazen:%20" target="_blank" rel="noopener">file an issue →</a>
  </div>

  <hr>
  <p style="font-size:12px">no deck. no memo. no partner meeting. just push.</p>

  <footer>
    <a class="real-tech" href="https://drawohara.io" target="_blank" rel="noopener">Real Tech</a>
    <span class="disclaimer" aria-label="Parody Disclaimer">This is a parody for people who actually build things. If you thought you were getting $1M for a deck, you're the problem.</span>
  </footer>
</body>
</html>
`;
}

function indexPage(haikus) {
  const ogImg = `${SITE_URL}/og.png`;
  const url = `${SITE_URL}/zazen/`;
  const items = haikus.map((h, i) => `
    <li>
      <span class="num">${String(i+1).padStart(2,'0')}</span>
      <span class="ttl"><a href="${htmlEscape(h.slug)}/">${htmlEscape(h.title)}</a></span>
      <span class="auth">— ${htmlEscape(h.author)}</span>
    </li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zazen — a16zee</title>
<meta name="description" content="haikus by mac adressing, felon husk, pita theelf. zazen for vibrating founders. #vcevil">

<link rel="canonical" href="${url}">
<meta name="theme-color" content="#ffffff">

<meta property="og:type" content="website">
<meta property="og:site_name" content="a16zee">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Zazen — a16zee">
<meta property="og:description" content="haikus by the venture-adjacent. zazen for vibrating founders. #vcevil">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@drawohara">
<meta name="twitter:title" content="Zazen — a16zee">
<meta name="twitter:description" content="haikus by the venture-adjacent. zazen for vibrating founders. #vcevil">
<meta name="twitter:image" content="${ogImg}">

<style>${SHARED_CSS}</style>
</head>
<body>
  <header>
    <h1><a href="/">a16zee</a> <span>// zazen</span></h1>
    <div class="tag">#vcevil</div>
  </header>

  <p>Seventeen syllables from the people who taught us how to vibrate. Some real. Some composite. None subpoenaed.</p>

  <h2>The Index</h2>
  <ul class="list">${items}
  </ul>

  <div class="cta">
    have your own zazen?
    <a href="${REPO_URL}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">open a pr →</a>
    or
    <a href="${REPO_URL}/issues/new?title=zazen:%20" target="_blank" rel="noopener">file an issue →</a>
  </div>

  <hr>
  <p style="font-size:12px">no deck. no memo. no partner meeting. just push.</p>

  <footer>
    <a class="real-tech" href="https://drawohara.io" target="_blank" rel="noopener">Real Tech</a>
    <span class="disclaimer" aria-label="Parody Disclaimer">This is a parody for people who actually build things. If you thought you were getting $1M for a deck, you're the problem.</span>
  </footer>
</body>
</html>
`;
}

// ---------- main -------------------------------------------------------------

async function main() {
  const haikus = readHaikus();
  console.log(`build: ${haikus.length} haikus`);

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  // per-haiku
  for (const h of haikus) {
    const dir = path.join(OUT, h.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), permalinkPage(h));
    await renderOgPng(h, path.join(dir, 'og.png'));
    process.stdout.write('.');
  }
  console.log();

  // index
  fs.writeFileSync(path.join(OUT, 'index.html'), indexPage(haikus));

  // manifest used by the landing page modal (small, body-only payload)
  const manifest = haikus.map(h => ({
    slug:   h.slug,
    title:  h.title,
    author: h.author,
    body:   h.body,
  }));
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));

  console.log(`build: wrote ${haikus.length} pages, ${haikus.length} og images, 1 index, 1 manifest`);
}

main().catch(err => { console.error(err); process.exit(1); });
