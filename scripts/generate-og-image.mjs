import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.resolve(projectRoot, "client/public/og-image.png");

// 1200x630 OGP image. ブランドカラー: ダークグリーン #2D4A3E / クリーム #FFF8E7。
// フォントは resvg-js が拾うシステムフォントに依存。M PLUS Rounded 1c があれば
// それを優先使用する設計だが、無くても Hiragino Sans 等の Japanese sans にフォールバック。
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.5" fill="#2D4A3E" opacity="0.08"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="#FFF8E7"/>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <rect x="80" y="120" width="6" height="56" rx="3" fill="#92400E"/>
  <text x="110" y="166" font-family="'M PLUS Rounded 1c','Hiragino Sans','Yu Gothic',sans-serif" font-weight="700" font-size="32" fill="#92400E" letter-spacing="0.04em">かんたん当番表</text>

  <text x="80" y="320" font-family="'M PLUS Rounded 1c','Hiragino Sans','Yu Gothic',sans-serif" font-weight="800" font-size="180" fill="#2D4A3E" letter-spacing="-0.02em">toban</text>

  <text x="80" y="416" font-family="'M PLUS Rounded 1c','Hiragino Sans','Yu Gothic',sans-serif" font-weight="700" font-size="52" fill="#1F2937">当番表を、かんたんに作って</text>
  <text x="80" y="480" font-family="'M PLUS Rounded 1c','Hiragino Sans','Yu Gothic',sans-serif" font-weight="700" font-size="52" fill="#1F2937">そのまま、きれいに印刷。</text>

  <line x1="80" y1="540" x2="200" y2="540" stroke="#92400E" stroke-width="2.5" stroke-linecap="round"/>
  <text x="80" y="582" font-family="'M PLUS Rounded 1c','Hiragino Sans','Yu Gothic',sans-serif" font-weight="700" font-size="26" fill="#92400E">無料・登録不要・すぐ使える</text>

  <text x="1120" y="582" text-anchor="end" font-family="'M PLUS Rounded 1c','Hiragino Sans','Yu Gothic',sans-serif" font-weight="700" font-size="28" fill="#2D4A3E">toban.app</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  font: {
    loadSystemFonts: true,
    defaultFontFamily: "Hiragino Sans",
  },
  background: "#FFF8E7",
});

const png = resvg.render().asPng();
await writeFile(outputPath, png);

const { width, height } = resvg.innerBBox() ?? { width: 1200, height: 630 };
console.log(
  `Generated ${path.relative(projectRoot, outputPath)} (${png.length} bytes, target 1200x630, content bbox ${width}x${height})`,
);
