// 앱 아이콘 생성: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#FCEBD8"/>
  <g transform="translate(76 96) scale(3)">
    <circle cx="26" cy="32" r="12" fill="none" stroke="#5A4030" stroke-width="5"/>
    <circle cx="94" cy="32" r="12" fill="none" stroke="#5A4030" stroke-width="5"/>
    <ellipse cx="60" cy="70" rx="47" ry="42" fill="none" stroke="#5A4030" stroke-width="5"/>
    <circle cx="26" cy="32" r="12" fill="#E9B07A"/>
    <circle cx="94" cy="32" r="12" fill="#E9B07A"/>
    <circle cx="26" cy="33" r="6.5" fill="#F2B9B0"/>
    <circle cx="94" cy="33" r="6.5" fill="#F2B9B0"/>
    <ellipse cx="60" cy="70" rx="47" ry="42" fill="#E9B07A"/>
    <ellipse cx="60" cy="86" rx="33" ry="24" fill="#FBEEDC"/>
    <circle cx="31" cy="78" r="11" fill="#FBEEDC"/>
    <circle cx="89" cy="78" r="11" fill="#FBEEDC"/>
    <ellipse cx="45" cy="61" rx="4.5" ry="5.5" fill="#3A2A1E"/>
    <ellipse cx="75" cy="61" rx="4.5" ry="5.5" fill="#3A2A1E"/>
    <circle cx="46.4" cy="59.2" r="1.6" fill="#fff"/>
    <circle cx="76.4" cy="59.2" r="1.6" fill="#fff"/>
    <ellipse cx="60" cy="69" rx="3.4" ry="2.5" fill="#D9707F"/>
    <path d="M54 74 q3 4 6 0 q3 4 6 0" stroke="#3A2A1E" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="32" cy="80" rx="7" ry="4" fill="#F4A3A8" opacity="0.75"/>
    <ellipse cx="88" cy="80" rx="7" ry="4" fill="#F4A3A8" opacity="0.75"/>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });
for (const size of [180, 192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
console.log("icons done");
