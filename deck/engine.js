// 動畫引擎：所有畫面都由「時間 t」決定（deterministic），
// 播放模式 t = 旁白音軌時間；錄製模式（?render）由 Playwright 逐格呼叫 renderAt(t)。
(function () {
  const TL = window.TIMELINE;
  const RENDER = /[?&]render\b/.test(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const easeOut = p => 1 - Math.pow(1 - p, 3);
  const easeBack = p => { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const GAP = 0.45;

  document.documentElement.classList.toggle('render', RENDER);

  // ---------- 投影片與時間軸對應 ----------
  const slides = TL.slides.map(s => {
    const el = $(`.slide[data-id="${s.id}"]`);
    if (!el) console.warn('missing slide', s.id);
    return Object.assign({}, s, { el });
  });

  function cueTime(s, c, d) {
    let t;
    if (c === 's' || c == null) t = s.start + 0.25;
    else if (/e$/.test(c)) t = s.lines[parseInt(c)].end;
    else t = s.lines[parseInt(c)].start;
    return t + (parseFloat(d) || 0);
  }

  slides.forEach(s => {
    if (!s.el) return;
    s.cues = $$('[data-c]', s.el).map(el => {
      const fx = el.dataset.fx || 'up';
      const at = cueTime(s, el.dataset.c, el.dataset.d);
      let dur = parseFloat(el.dataset.dur) || (fx === 'type' ? 3 : fx === 'stamp' ? 0.45 : 0.6);
      const item = { el, fx, at, dur };
      if (fx === 'type') {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        item.nodes = [];
        while (walker.nextNode()) item.nodes.push({ n: walker.currentNode, v: walker.currentNode.nodeValue });
        item.len = item.nodes.reduce((a, x) => a + x.v.length, 0);
        if (el.dataset.dur === 'line') {
          const k = parseInt(el.dataset.c);
          item.dur = (s.lines[k].end - s.lines[k].start) * 0.92;
        }
      }
      if (fx === 'draw') {
        item.paths = $$('path,line,polyline', el).map(p => { const L = p.getTotalLength ? p.getTotalLength() : 300; p.style.strokeDasharray = L; return { p, L }; });
      }
      return item;
    });
    s.hls = $$('[data-hl]', s.el).map(el => ({
      el,
      wins: el.dataset.hl.split(',').map(k => { const l = s.lines[parseInt(k)]; return [l.start, l.end + GAP]; })
    }));
  });

  function applyCue(c, t) {
    const raw = clamp((t - c.at) / c.dur);
    const el = c.el;
    switch (c.fx) {
      case 'fade': el.style.opacity = easeOut(raw); break;
      case 'up': el.style.opacity = raw; el.style.translate = `0 ${(1 - easeOut(raw)) * 34}px`; break;
      case 'down': el.style.opacity = raw; el.style.translate = `0 ${-(1 - easeOut(raw)) * 34}px`; break;
      case 'left': el.style.opacity = raw; el.style.translate = `${-(1 - easeOut(raw)) * 70}px 0`; break;
      case 'right': el.style.opacity = raw; el.style.translate = `${(1 - easeOut(raw)) * 70}px 0`; break;
      case 'pop': el.style.opacity = clamp(raw * 2); el.style.scale = raw <= 0 ? 0.3 : 0.3 + 0.7 * easeBack(raw); break;
      case 'stamp': el.style.opacity = clamp(raw * 3); el.style.scale = 2.4 - 1.4 * easeOut(raw); break;
      case 'slideup': el.style.opacity = clamp(raw * 2); el.style.translate = `0 ${(1 - easeOut(raw)) * 260}px`; break;
      case 'wipe': el.style.opacity = raw > 0 ? 1 : 0; el.style.clipPath = `inset(0 ${(1 - easeOut(raw)) * 100}% 0 0)`; break;
      case 'draw': el.style.opacity = raw > 0 ? 1 : 0; c.paths.forEach(({ p, L }) => p.style.strokeDashoffset = L * (1 - easeOut(raw))); break;
      case 'type': {
        el.style.opacity = t >= c.at ? 1 : 0;
        let n = Math.round(c.len * raw);
        c.nodes.forEach(x => { const k = Math.min(n, x.v.length); x.n.nodeValue = x.v.slice(0, k); n -= k; });
        el.classList.toggle('typing', raw > 0 && raw < 1);
        break;
      }
    }
  }

  function applyHl(h, t) {
    let v = 0;
    h.wins.forEach(([a, b]) => {
      v = Math.max(v, Math.min(clamp((t - a) / 0.3), clamp((b - t) / 0.3)));
    });
    h.el.style.setProperty('--hl', v.toFixed(3));
    h.el.classList.toggle('hl-on', v > 0.5);
  }

  // ---------- 字幕：依標點切段，依字數分配時間 ----------
  const MAXC = 30;
  function chunk(text) {
    const sents = text.match(/[^。！？]+[。！？]*/g) || [text];
    const out = [];
    sents.forEach(s => {
      s = s.trim();
      if (!s) return;
      if (s.length <= MAXC) { out.push(s); return; }
      const parts = s.match(/[^，、；：]+[，、；：]?/g);
      let cur = '';
      parts.forEach(p => {
        if ((cur + p).length > MAXC && cur) { out.push(cur); cur = p; } else cur += p;
      });
      if (cur) out.push(cur);
    });
    return out;
  }
  slides.forEach(s => s.lines.forEach(l => {
    const cs = chunk(l.text);
    const w = cs.map(c => c.replace(/[，。！？、；：～\s]/g, '').length + 1);
    const tot = w.reduce((a, b) => a + b, 0);
    let acc = l.start;
    l.chunks = cs.map((c, i) => {
      const d = (l.end - l.start) * w[i] / tot;
      const r = { text: c.replace(/[，。、；：]$/, ''), start: acc, end: acc + d };
      acc += d;
      return r;
    });
  }));

  // ---------- 角色 ----------
  const cast = $('#cast');
  cast.innerHTML = `
    <div class="char arale" id="arale">${window.charHTML('arale')}</div>
    <div class="char allan" id="allan">${window.charHTML('allan')}</div>`;
  const chars = {
    A: { root: $('#allan'), seed: 0, def: window.CHARS.allan },
    R: { root: $('#arale'), seed: 1.7, def: window.CHARS.arale }
  };
  Object.values(chars).forEach(c => {
    c.spr = $('.spr', c.root);
    c.mo = $('.m-open', c.root);
    c.mc = $('.m-closed', c.root);
    c.lids = $('.lids', c.root);
    c.react = $('.react', c.root);
    c.reactImg = $('.react img', c.root);
    c.face = '';
  });

  // 預先載入全部表情圖，錄影時第一格就有圖
  const preload = [];
  Object.values(window.CHARS).forEach(d => [d.img, ...Object.values(d.faces).map(f => `img/${f}.png`)].forEach(src => {
    const im = new Image(); im.src = src; preload.push(im.decode().catch(() => {}));
  }));

  // 對話時的表情（取自角色表情包）
  function faceFor(who, line) {
    const tx = line.text;
    if (line.who !== who) return '';
    if (who === 'R') {
      if (/中了五個/.test(tx)) return 'cry';
      if (/咻|謝謝/.test(tx)) return 'cheer';
      if (/陰險|哈囉/.test(tx)) return 'laugh';
      if (/什麼|可怕|嗚哇|哇/.test(tx)) return 'surprised';
      if (/？/.test(tx)) return 'think';
      if (/懂了|筆記|重點|原來/.test(tx)) return 'thumb';
      if (/部分|測驗|第.題|珍珠/.test(tx)) return 'explain';
      return '';
    }
    if (/哈哈/.test(tx)) return 'laugh';
    if (/加薪|答對|完全正確|說得太好|這叫專業/.test(tx)) return 'wink';
    if (/^錯！|^不行！|^絕對不是|^當然要|殘酷/.test(tx)) return 'point';
    if (/案例/.test(tx)) return 'think';
    if (/^對！/.test(tx)) return 'smile';
    return '';
  }

  function animChars(t, s, line) {
    ['A', 'R'].forEach(who => {
      const c = chars[who];
      const speaking = line && line.who === who && t < line.end;
      const ph = t + c.seed;
      const flap = speaking && (Math.sin(t * 19) + Math.sin(t * 12.7 + 1.3) > -0.2);
      c.mo.style.display = flap ? '' : 'none';
      c.mc.style.display = flap ? 'none' : '';
      c.lids.style.display = (ph % 3.9) < 0.13 ? '' : 'none';
      let y = Math.sin(ph * 1.7) * 2.5, rot = Math.sin(ph * 0.9) * 0.6, x = 0, sq = 1;
      if (speaking) {
        const b = Math.abs(Math.sin(t * (who === 'R' ? 6.5 : 4.2)));
        y = -b * (who === 'R' ? 9 : 5);
        sq = 1 + b * 0.012;
        rot = Math.sin(t * 2.3) * 1.8;
      }
      let zoom = false;
      // 「咻～」：阿拉蕾衝刺橫越畫面
      if (who === 'R' && speaking && /咻/.test(line.text)) {
        const p = clamp((t - line.start) / (line.end - line.start + 0.4));
        const wave = Math.sin(Math.PI * p);
        x = -Math.pow(wave, 0.6) * 820;
        rot = -12 * wave;
        zoom = wave > 0.15;
      }
      c.root.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      c.spr.style.transform = `scaleY(${sq})`;
      c.root.classList.toggle('talking', !!speaking);
      c.root.classList.toggle('zoom', zoom);
      // 表情泡泡
      let f = '', ep = 0;
      if (line && t < line.end + 0.2) { f = faceFor(who, line); ep = clamp((t - line.start - 0.2) / 0.35); }
      if (f && f !== c.face) { c.reactImg.src = `img/${c.def.faces[f]}.png`; }
      if (f) c.face = f;
      c.react.style.opacity = f ? ep : 0;
      c.react.style.scale = f ? 0.4 + 0.6 * easeBack(ep) : 0.4;
    });
  }

  // ---------- 上方進度（課程分段） ----------
  const PARTS = ['開場導覽', 'ISMS 作業重點', '稽核查核重點', '常見的缺失', '總結測驗'];
  const nav = $('#partnav');
  nav.innerHTML = PARTS.map((p, i) => `<div class="pn" data-p="${i}"><span>${i ? i < 4 ? i : '★' : '▶'}</span>${p}</div>`).join('');
  const pnEls = $$('.pn', nav);

  const side = $('#side');
  const sub = $('#sub');
  const subWho = $('#subwho');
  const subTx = $('#subtx');

  // ---------- 背景粒子 ----------
  const bubbles = $$('#bg .blob');
  let confetti = null;
  const cbox = $('#confetti');
  if (cbox) {
    const sl = slides.find(x => x.el && x.el.contains(cbox));
    const cue = sl && sl.cues.find(c => c.el === cbox);
    confetti = { slide: sl, at: cue ? cue.at : 0, items: [...cbox.children] };
  }

  let lastSlide = -1;
  function render(t) {
    t = clamp(t, 0, TL.total);
    let si = slides.findIndex(s => t >= s.start && t < s.end);
    if (si < 0) si = t >= TL.total ? slides.length - 1 : 0;
    const s = slides[si];

    slides.forEach((x, i) => {
      if (!x.el) return;
      let o = 0, ty = 0;
      if (i === si) { const p = clamp((t - x.start) / 0.45); o = p; ty = (1 - easeOut(p)) * 22; }
      else if (i === si - 1 && t - x.end < 0.35) { o = 1 - clamp((t - x.end) / 0.35); ty = -(1 - o) * 14; }
      x.el.style.opacity = o;
      x.el.style.translate = `0 ${ty}px`;
      x.el.style.visibility = o > 0 ? 'visible' : 'hidden';
      if (o > 0) { x.cues.forEach(c => applyCue(c, t)); x.hls.forEach(h => applyHl(h, t)); }
    });

    if (si !== lastSlide) {
      lastSlide = si;
      pnEls.forEach((el, i) => { el.classList.toggle('on', i === s.part); el.classList.toggle('done', i < s.part); });
      const [ic, big, small] = (s.el && s.el.dataset.side || '||').split('|');
      side.innerHTML = `<div class="si">${ic}</div><div class="sb">${big}</div><div class="ss">${small}</div>`;
      document.dispatchEvent(new CustomEvent('slidechange', { detail: si }));
    }
    const sp = clamp((t - s.start) / 0.5);
    side.style.opacity = sp;
    side.style.scale = 0.8 + 0.2 * easeBack(sp);

    // 目前句子
    let line = null, prev = null;
    for (const l of s.lines) { if (t >= l.start - 0.05) { prev = line; line = l; } }
    const active = line && t <= line.end + 0.25 ? line : null;
    animChars(t, s, active);

    // 字幕
    let ch = null;
    if (active) ch = active.chunks.find(c => t >= c.start && t < c.end + 0.25) || active.chunks[active.chunks.length - 1];
    if (ch && t <= active.end + 0.25) {
      sub.classList.add('show');
      sub.classList.toggle('arale', active.who === 'R');
      subWho.textContent = active.who === 'A' ? 'Allan 老師' : '阿拉蕾';
      if (subTx.textContent !== ch.text) subTx.textContent = ch.text;
    } else sub.classList.remove('show');

    if (confetti && confetti.slide === s) {
      const dt = Math.max(0, t - confetti.at);
      confetti.items.forEach(el => {
        const d = el.dataset;
        const y = +d.y0 + dt * +d.v;
        el.style.top = (y % 130 - 15) + '%';
        el.style.transform = `translateX(${Math.sin(dt * 2 + +d.sway) * 14}px) rotate(${+d.rot + dt * +d.spin}deg)`;
      });
    }
    bubbles.forEach((b, i) => {
      b.style.transform = `translate(${Math.sin(t * 0.21 + i * 2) * 40}px, ${Math.cos(t * 0.17 + i) * 30}px)`;
    });
    return si;
  }

  // ---------- 舞台縮放 ----------
  const stage = $('#stage');
  // 播放模式在舞台下方保留控制列空間，避免遮住字幕
  const BAR = RENDER ? 0 : 64;
  function fit() {
    const h = innerHeight - BAR;
    const k = Math.min(innerWidth / 1280, h / 720);
    stage.style.top = (h / 2) + 'px';
    stage.style.transform = `translate(-50%, -50%) scale(${k})`;
  }
  addEventListener('resize', fit);
  fit();

  window.DECK = { render, slides, TL, RENDER, ready: Promise.all(preload) };
  window.renderAt = t => { render(t); };

  if (RENDER) { render(0); return; }

  // ---------- 播放器 ----------
  const audio = $('#narration');
  const playBtn = $('#play');
  const bar = $('#bar');
  const fill = $('#fill');
  const timeEl = $('#time');
  const ctl = $('#controls');
  const startEl = $('#start');

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function seek(t) { audio.currentTime = clamp(t, 0, TL.total - 0.01); render(audio.currentTime); }
  function toggle() { audio.paused ? audio.play() : audio.pause(); }
  function goto(d) {
    const t = audio.currentTime;
    let si = slides.findIndex(s => t >= s.start && t < s.end);
    if (d < 0 && t - slides[Math.max(si, 0)].start > 2) d = 0;
    si = clamp(si + d, 0, slides.length - 1);
    seek(slides[si].start + 0.01);
  }

  function begin() { startEl.hidden = true; audio.play(); }
  $('#go').addEventListener('click', begin);

  // ---------- 章節選單 ----------
  const chapEl = $('#chapters');
  const chapBtn = $('#chap');
  let html = '', lastPart = -1;
  slides.forEach((s, i) => {
    if (s.part !== lastPart) { lastPart = s.part; html += `<div class="ch-part">${PARTS[s.part]}</div>`; }
    html += `<button class="ch" type="button" data-i="${i}"><time>${fmt(s.start)}</time><span>${s.el ? s.el.dataset.title : s.id}</span></button>`;
  });
  chapEl.innerHTML = html;
  const chBtns = $$('.ch', chapEl);
  function showChapters(on) {
    chapEl.hidden = !on;
    chapBtn.setAttribute('aria-expanded', on);
    ctl.classList.toggle('vis', on);
    if (on) { const c = chapEl.querySelector('.ch.cur') || chBtns[0]; c.focus(); c.scrollIntoView({ block: 'nearest' }); }
  }
  chBtns.forEach(b => b.addEventListener('click', () => {
    seek(slides[+b.dataset.i].start + 0.01);
    showChapters(false);
    begin();
  }));
  chapBtn.addEventListener('click', e => { e.stopPropagation(); showChapters(chapEl.hidden); });
  $('#startchap').addEventListener('click', () => showChapters(true));
  document.addEventListener('slidechange', e => chBtns.forEach((b, i) => b.classList.toggle('cur', i === e.detail)));
  addEventListener('pointerdown', e => { if (!chapEl.hidden && !chapEl.contains(e.target) && e.target !== chapBtn && e.target.id !== 'startchap') showChapters(false); });
  $('#ticks').innerHTML = slides.map(s => `<i style="left:${s.start / TL.total * 100}%" title="${s.el ? s.el.dataset.title : ''}"></i>`).join('');
  playBtn.addEventListener('click', toggle);
  $('#prev').addEventListener('click', () => goto(-1));
  $('#next').addEventListener('click', () => goto(1));
  $('#cc').addEventListener('click', e => { document.body.classList.toggle('nocc'); e.currentTarget.classList.toggle('off'); });
  const rates = [1, 1.25, 1.5, 0.8];
  $('#rate').addEventListener('click', e => {
    const r = rates[(rates.indexOf(audio.playbackRate) + 1) % rates.length];
    audio.playbackRate = r; e.currentTarget.textContent = r + 'x';
  });
  $('#fs').addEventListener('click', () => {
    try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); } catch (_) {}
  });
  stage.addEventListener('click', e => { if (startEl.hidden && !startEl.contains(e.target)) toggle(); });
  bar.addEventListener('pointerdown', e => {
    const r = bar.getBoundingClientRect();
    const mv = ev => seek((ev.clientX - r.left) / r.width * TL.total);
    mv(e);
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { showChapters(false); return; }
    if (!chapEl.hidden && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === 'm') { showChapters(chapEl.hidden); return; }
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); if (!startEl.hidden) begin(); else toggle(); }
    else if (e.key === 'ArrowRight') goto(1);
    else if (e.key === 'ArrowLeft') goto(-1);
    else if (e.key === 'c') $('#cc').click();
    else if (e.key === 'f') $('#fs').click();
  });
  audio.addEventListener('play', () => { startEl.hidden = true; playBtn.textContent = '❚❚'; document.body.classList.remove('paused'); });
  audio.addEventListener('pause', () => { playBtn.textContent = '▶'; document.body.classList.add('paused'); });

  let idle;
  addEventListener('pointermove', () => {
    ctl.classList.add('vis'); clearTimeout(idle);
    idle = setTimeout(() => { if (chapEl.hidden) ctl.classList.remove('vis'); }, 2600);
  });

  // 從網址 #slide-id 開始
  const h = location.hash.slice(1);
  const hs = slides.find(s => s.id === h);
  if (hs) audio.currentTime = hs.start + 0.01;

  (function loop() {
    const t = audio.currentTime || 0;
    render(t);
    fill.style.width = (t / TL.total * 100) + '%';
    timeEl.textContent = `${fmt(t)} / ${fmt(TL.total)}`;
    requestAnimationFrame(loop);
  })();
})();
