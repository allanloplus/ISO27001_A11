// Q版角色：使用使用者提供的角色設定圖（assets/characters/*_sheet.jpg），
// 由 build/sprites.py 裁切去背成 deck/img/*.png。
// 這裡在全身圖上疊一層 SVG（座標＝原圖像素），做嘴巴開合與眨眼；
// 表情包半身像用在對話時的「反應泡泡」。
window.CHARS = {
  allan: {
    img: 'img/allan_body.png', w: 681, h: 1375,
    // 預設是閉嘴微笑，說話時疊上張嘴
    open: `<path d="M211 285 Q264 301 317 285 Q306 324 264 327 Q222 324 211 285 Z" fill="#6b1d1d"/>
           <path d="M218 287 Q264 302 310 287 L306 296 Q264 309 222 296 Z" fill="#fff"/>
           <ellipse cx="264" cy="316" rx="22" ry="7" fill="#e0646b"/>
           <path d="M211 285 Q264 301 317 285" fill="none" stroke="#2a1410" stroke-width="5" stroke-linecap="round"/>`,
    closed: '',
    blink: `<ellipse cx="206" cy="194" rx="23" ry="13" fill="#fcc9a8"/><ellipse cx="316" cy="193" rx="23" ry="13" fill="#fcc9a8"/>
            <path d="M186 196 Q206 203 226 196 M296 195 Q316 202 336 195" fill="none" stroke="#2a1410" stroke-width="4" stroke-linecap="round"/>`,
    faces: { smile: 'allan_smile', laugh: 'allan_laugh', think: 'allan_think', confused: 'allan_confused',
             surprised: 'allan_surprised', point: 'allan_point', wink: 'allan_wink', worried: 'allan_worried' }
  },
  arale: {
    img: 'img/arale_body.png', w: 326, h: 666,
    // 預設是張嘴笑，安靜時疊上閉嘴微笑
    open: '',
    closed: `<ellipse cx="174" cy="174" rx="25" ry="14" fill="#f8c3a2"/>
             <path d="M156 170 Q174 182 192 170" fill="none" stroke="#5a2a20" stroke-width="3.5" stroke-linecap="round"/>`,
    blink: `<ellipse cx="140" cy="132" rx="13" ry="14" fill="#fbc5a6"/><ellipse cx="202" cy="132" rx="13" ry="14" fill="#fbc5a6"/>
            <path d="M127 134 Q140 141 153 134 M189 134 Q202 141 215 134" fill="none" stroke="#1f2340" stroke-width="3" stroke-linecap="round"/>`,
    faces: { laugh: 'arale_laugh', think: 'arale_think', surprised: 'arale_surprised', confused: 'arale_confused',
             explain: 'arale_explain', cry: 'arale_cry', thumb: 'arale_thumb', cheer: 'arale_cheer' }
  }
};

window.charHTML = function (key) {
  const c = window.CHARS[key];
  return `<div class="speed"></div>
    <div class="react"><img alt=""></div>
    <div class="spr">
      <img class="body" src="${c.img}" alt="${key === 'allan' ? 'Allan Lo 講師' : '助教阿拉蕾'}">
      <svg viewBox="0 0 ${c.w} ${c.h}" aria-hidden="true">
        <g class="m-open">${c.open}</g><g class="m-closed">${c.closed}</g><g class="lids" style="display:none">${c.blink}</g>
      </svg>
    </div>`;
};
