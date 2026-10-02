// Q版角色（內嵌 SVG）：講師 Allan Lo、助教阿拉蕾
// 由 engine 依時間控制：嘴巴開合（說話）、眨眼、手臂揮動、跳動
window.CHAR_SVG = {
  allan: `
<svg viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" class="char-svg">
  <ellipse cx="110" cy="312" rx="62" ry="7" fill="rgba(0,40,20,.18)"/>
  <g class="c-body">
    <!-- 腿與鞋 -->
    <rect x="80" y="262" width="22" height="40" rx="8" fill="#233a5e"/>
    <rect x="118" y="262" width="22" height="40" rx="8" fill="#233a5e"/>
    <ellipse cx="88" cy="304" rx="20" ry="9" fill="#2a2a2a"/>
    <ellipse cx="132" cy="304" rx="20" ry="9" fill="#2a2a2a"/>
    <!-- 左手（固定，叉腰） -->
    <path d="M62 190 Q38 222 58 250" stroke="#2c4a7a" stroke-width="20" fill="none" stroke-linecap="round"/>
    <circle cx="60" cy="252" r="11" fill="#ffd9bf"/>
    <!-- 西裝 -->
    <path d="M58 188 Q60 168 110 166 Q160 168 162 188 L168 270 Q110 282 52 270 Z" fill="#2c4a7a"/>
    <path d="M96 168 L110 210 L124 168 Z" fill="#ffffff"/>
    <path d="M106 176 L114 176 L118 226 L110 236 L102 226 Z" fill="#d6332f"/>
    <path d="M96 168 L110 210 L84 196 Z" fill="#1f3961"/>
    <path d="M124 168 L110 210 L136 196 Z" fill="#1f3961"/>
    <!-- 名牌 -->
    <rect x="128" y="214" width="34" height="18" rx="4" fill="#fff" stroke="#16a34a" stroke-width="2"/>
    <text x="145" y="227" font-size="10" font-weight="900" text-anchor="middle" fill="#15803d" font-family="Baloo 2, sans-serif">Allan</text>
  </g>
  <!-- 右手（拿指揮棒，說話時揮動） -->
  <g class="c-arm" style="transform-origin:160px 192px">
    <path d="M160 192 Q190 176 196 150" stroke="#2c4a7a" stroke-width="20" fill="none" stroke-linecap="round"/>
    <circle cx="197" cy="146" r="11" fill="#ffd9bf"/>
    <line x1="197" y1="146" x2="214" y2="86" stroke="#7a4b21" stroke-width="5" stroke-linecap="round"/>
    <circle cx="214" cy="84" r="6" fill="#facc15" stroke="#a16207" stroke-width="2"/>
  </g>
  <g class="c-head">
    <!-- 耳朵 -->
    <ellipse cx="44" cy="104" rx="11" ry="15" fill="#ffd0ad"/>
    <ellipse cx="176" cy="104" rx="11" ry="15" fill="#ffd0ad"/>
    <!-- 臉 -->
    <ellipse cx="110" cy="100" rx="66" ry="68" fill="#ffdcc3"/>
    <!-- 頭髮：俐落短髮旁分 -->
    <path d="M44 92 Q40 34 106 26 Q170 22 178 84 Q166 64 140 58 Q118 70 80 62 Q60 66 50 98 Z" fill="#1d1d24"/>
    <path d="M84 40 Q118 22 156 44" stroke="#3b3b48" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- 眉毛 -->
    <path d="M70 80 Q82 72 96 78" stroke="#1d1d24" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M124 78 Q138 72 150 80" stroke="#1d1d24" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- 眼睛 -->
    <g class="c-eyes" style="transform-origin:110px 100px">
      <ellipse cx="84" cy="100" rx="8" ry="10" fill="#1d1d24"/>
      <ellipse cx="136" cy="100" rx="8" ry="10" fill="#1d1d24"/>
      <circle cx="87" cy="96" r="3" fill="#fff"/>
      <circle cx="139" cy="96" r="3" fill="#fff"/>
    </g>
    <!-- 眼鏡 -->
    <rect x="62" y="84" width="44" height="32" rx="12" fill="rgba(255,255,255,.18)" stroke="#1d1d24" stroke-width="4"/>
    <rect x="114" y="84" width="44" height="32" rx="12" fill="rgba(255,255,255,.18)" stroke="#1d1d24" stroke-width="4"/>
    <line x1="106" y1="98" x2="114" y2="98" stroke="#1d1d24" stroke-width="4"/>
    <!-- 腮紅 -->
    <ellipse cx="70" cy="128" rx="10" ry="6" fill="#ff9a9a" opacity=".55"/>
    <ellipse cx="150" cy="128" rx="10" ry="6" fill="#ff9a9a" opacity=".55"/>
    <!-- 嘴巴 -->
    <path class="m-closed" d="M96 136 Q110 148 124 136" stroke="#7c2d12" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <g class="m-open" style="display:none">
      <path d="M94 132 Q110 132 126 132 Q124 156 110 156 Q96 156 94 132 Z" fill="#7c2d12"/>
      <path d="M100 148 Q110 142 120 148 Q116 155 110 155 Q104 155 100 148 Z" fill="#f87171"/>
      <rect x="98" y="132" width="24" height="5" rx="2" fill="#fff"/>
    </g>
  </g>
</svg>`,

  arale: `
<svg viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" class="char-svg">
  <ellipse cx="110" cy="312" rx="54" ry="7" fill="rgba(0,40,20,.18)"/>
  <g class="c-body">
    <!-- 腿與鞋 -->
    <rect x="86" y="262" width="18" height="36" rx="7" fill="#ffe4d1"/>
    <rect x="116" y="262" width="18" height="36" rx="7" fill="#ffe4d1"/>
    <ellipse cx="92" cy="302" rx="17" ry="9" fill="#e11d48"/>
    <ellipse cx="128" cy="302" rx="17" ry="9" fill="#e11d48"/>
    <!-- 手臂（說話時張開） -->
    <g class="c-arm-l" style="transform-origin:72px 196px">
      <path d="M72 196 Q48 214 44 240" stroke="#f472b6" stroke-width="16" fill="none" stroke-linecap="round"/>
      <circle cx="44" cy="244" r="10" fill="#ffe4d1"/>
    </g>
    <g class="c-arm-r" style="transform-origin:148px 196px">
      <path d="M148 196 Q172 214 176 240" stroke="#f472b6" stroke-width="16" fill="none" stroke-linecap="round"/>
      <circle cx="176" cy="244" r="10" fill="#ffe4d1"/>
    </g>
    <!-- 上衣與吊帶褲 -->
    <path d="M70 196 Q72 178 110 176 Q148 178 150 196 L152 236 L68 236 Z" fill="#f472b6"/>
    <path d="M70 226 L150 226 L156 272 Q110 282 64 272 Z" fill="#60a5fa"/>
    <rect x="84" y="200" width="52" height="34" rx="6" fill="#60a5fa"/>
    <line x1="84" y1="200" x2="76" y2="182" stroke="#60a5fa" stroke-width="8" stroke-linecap="round"/>
    <line x1="136" y1="200" x2="144" y2="182" stroke="#60a5fa" stroke-width="8" stroke-linecap="round"/>
    <circle cx="92" cy="206" r="3.5" fill="#facc15"/>
    <circle cx="128" cy="206" r="3.5" fill="#facc15"/>
    <text x="110" y="226" font-size="12" font-weight="900" text-anchor="middle" fill="#fff" font-family="Chiron GoRound TC, sans-serif">助教</text>
  </g>
  <g class="c-head">
    <!-- 頭髮後層 -->
    <path d="M38 100 Q34 168 62 176 L158 176 Q186 168 182 100 Z" fill="#5b3a8e"/>
    <!-- 臉 -->
    <ellipse cx="110" cy="112" rx="64" ry="62" fill="#ffe4d1"/>
    <!-- 瀏海 -->
    <path d="M44 106 Q46 56 110 52 Q174 56 176 106 Q164 84 150 80 L146 96 L132 80 L124 96 L110 80 L98 96 L88 80 L76 96 L70 80 Q54 88 44 106 Z" fill="#5b3a8e"/>
    <!-- 紅色帽子＋小翅膀 -->
    <path d="M52 70 Q58 22 110 20 Q162 22 168 70 Q110 54 52 70 Z" fill="#e11d48"/>
    <path d="M52 70 Q110 54 168 70 Q170 78 166 80 Q110 64 54 80 Q50 78 52 70 Z" fill="#be123c"/>
    <path d="M56 50 Q30 34 22 50 Q34 50 30 60 Q44 56 54 62 Z" fill="#fff" stroke="#cbd5e1" stroke-width="1.5"/>
    <path d="M164 50 Q190 34 198 50 Q186 50 190 60 Q176 56 166 62 Z" fill="#fff" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="110" cy="40" r="7" fill="#fff"/>
    <!-- 大圓眼鏡 -->
    <circle cx="82" cy="118" r="23" fill="rgba(255,255,255,.35)" stroke="#2b2b33" stroke-width="5"/>
    <circle cx="138" cy="118" r="23" fill="rgba(255,255,255,.35)" stroke="#2b2b33" stroke-width="5"/>
    <line x1="105" y1="116" x2="115" y2="116" stroke="#2b2b33" stroke-width="5"/>
    <g class="c-eyes" style="transform-origin:110px 120px">
      <ellipse cx="82" cy="120" rx="7" ry="9" fill="#2b2b33"/>
      <ellipse cx="138" cy="120" rx="7" ry="9" fill="#2b2b33"/>
      <circle cx="85" cy="116" r="3" fill="#fff"/>
      <circle cx="141" cy="116" r="3" fill="#fff"/>
    </g>
    <ellipse cx="62" cy="146" rx="9" ry="5" fill="#fb7185" opacity=".55"/>
    <ellipse cx="158" cy="146" rx="9" ry="5" fill="#fb7185" opacity=".55"/>
    <!-- 嘴巴：張大嘴 -->
    <path class="m-closed" d="M100 150 Q110 160 120 150" stroke="#9f1239" stroke-width="4" fill="none" stroke-linecap="round"/>
    <g class="m-open" style="display:none">
      <ellipse cx="110" cy="156" rx="16" ry="12" fill="#9f1239"/>
      <ellipse cx="110" cy="162" rx="9" ry="5" fill="#fb7185"/>
    </g>
  </g>
</svg>`
};
