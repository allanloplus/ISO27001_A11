#!/usr/bin/env node
// 逐格錄製動畫簡報為 MP4（1920×1080），並合成旁白音軌。
// 用法：
//   node build/render.js                 → 輸出 video/供應者關係安全_動畫課程.mp4
//   node build/render.js --stills 5,60   → 只擷取指定秒數的截圖到 build/stills/
//   選項：--fps 24  --workers 3  --from 0 --to 30（只錄一段，除錯用）
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DECK = path.join(ROOT, 'deck', 'index.html');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const FPS = +(args.fps || 24);
const WORKERS = +(args.workers || 3);
const OUT = args.out || path.join(ROOT, 'video', '供應者關係安全_動畫課程.mp4');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + DECK + '?render', { waitUntil: 'load' });
  await page.waitForFunction(() => window.renderAt && window.DECK);
  // 預先把每一頁完整顯示一次，確保所有中文字型分片都已下載
  const ends = await page.evaluate(() => DECK.slides.map(s => s.end - 0.3));
  for (const t of ends) {
    await page.evaluate(t => renderAt(t), t);
    await page.evaluate(() => document.fonts.ready);
  }
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

function run(cmd, a, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: ['pipe', 'inherit', 'inherit'], ...opts });
    p.on('exit', c => c === 0 ? res() : rej(new Error(cmd + ' exit ' + c)));
    p.on('error', rej);
    run.last = p;
  });
}

async function renderSegment(browser, i, f0, f1, file) {
  const page = await openPage(browser);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('exit', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => renderAt(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % (FPS * 30) === 0) {
      const pct = ((f - f0) / (f1 - f0) * 100).toFixed(1);
      console.log(`[worker ${i}] ${pct}%  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
  ff.stdin.end();
  await done;
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  if (args.stills) {
    const dir = path.join(ROOT, 'build', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    const page = await openPage(browser);
    for (const s of String(args.stills).split(',')) {
      await page.evaluate(t => renderAt(t), +s);
      await page.screenshot({ path: path.join(dir, `t${String(s).padStart(4, '0')}.png`) });
    }
    await browser.close();
    return;
  }
  const total = await (async () => { const p = await openPage(browser); const v = await p.evaluate(() => DECK.TL.total); await p.close(); return v; })();
  const from = +(args.from || 0), to = Math.min(+(args.to || total), total);
  const F0 = Math.round(from * FPS), F1 = Math.round(to * FPS);
  const per = Math.ceil((F1 - F0) / WORKERS);
  const tmp = path.join(ROOT, 'build', '.segments');
  fs.mkdirSync(tmp, { recursive: true });
  const segs = [];
  for (let i = 0; i < WORKERS; i++) {
    const a = F0 + i * per, b = Math.min(F1, a + per);
    if (a < b) segs.push({ i, a, b, file: path.join(tmp, `seg${i}.mp4`) });
  }
  console.log(`錄製 ${((F1 - F0) / FPS).toFixed(1)} 秒、${F1 - F0} 格、${segs.length} 個 worker`);
  await Promise.all(segs.map(s => renderSegment(browser, s.i, s.a, s.b, s.file)));
  await browser.close();

  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, segs.map(s => `file '${s.file}'`).join('\n'));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-ss', String(from), '-t', String(to - from), '-i', path.join(ROOT, 'deck', 'audio', 'narration.mp3'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', OUT]);
  console.log('完成：' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
