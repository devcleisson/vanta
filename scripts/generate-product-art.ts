/**
 * Generates the flat-lay product renders used by the demo catalog.
 * One front and one back view per product colour, as lightweight SVGs:
 *   public/images/products/<slug>/<color>-<front|back>.svg
 *
 * Run: npm run art:generate
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { seedColors, seedProducts, type BackPrint, type GarmentKind } from "../src/server/db/seed-data";

const W = 1000;
const H = 1250;
const BG = "#E8E8E6";

type Pt = [number, number];
const mx = (x: number) => W - x;

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

type Palette = { base: string; dark: string; light: string; line: string; stitch: string; ink: string; inner: string };
function palette(hex: string): Palette {
  const isDark = luminance(hex) < 0.45;
  return {
    base: hex,
    dark: shade(hex, isDark ? -0.04 : -0.1),
    light: shade(hex, isDark ? 0.06 : 0.04),
    line: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)",
    stitch: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)",
    ink: isDark ? "#EDEDEA" : "#141414",
    inner: shade(hex, isDark ? -0.06 : -0.18),
  };
}

const poly = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");

/* ─────────────── Tops (parametric, symmetric) ─────────────── */

type TopSpec = {
  neck: number; neckY: number; neckDepth: number;
  shoulder: number; shoulderY: number;
  sleeve: Pt[]; // right-side sleeve points (absolute x), from shoulder outward to armpit side
  armpit: Pt; hem: Pt;
};

function topPath(s: TopSpec, back: boolean) {
  const nR: Pt = [500 + s.neck, s.neckY];
  const nL: Pt = [500 - s.neck, s.neckY];
  const depth = back ? s.neckY + 16 : s.neckY + s.neckDepth;
  const right: Pt[] = [[500 + s.shoulder, s.shoulderY], ...s.sleeve, s.armpit, s.hem];
  const left = right.map(([x, y]) => [mx(x), y] as Pt).reverse();
  const hemR = s.hem, hemL: Pt = [mx(s.hem[0]), s.hem[1]];
  return [
    `M ${nL[0]} ${nL[1]}`,
    `C ${nL[0] + 30} ${depth}, ${nR[0] - 30} ${depth}, ${nR[0]} ${nR[1]}`,
    ...right.map(([x, y]) => `L ${x} ${y}`),
    `C ${hemR[0] - 120} ${hemR[1] + 12}, ${hemL[0] + 120} ${hemL[1] + 12}, ${hemL[0]} ${hemL[1]}`,
    ...left.slice(1).map(([x, y]) => `L ${x} ${y}`),
    "Z",
  ].join(" ");
}

const TOPS: Record<string, TopSpec> = {
  tee: {
    neck: 100, neckY: 190, neckDepth: 52, shoulder: 205, shoulderY: 222,
    sleeve: [[868, 352], [792, 470]], armpit: [714, 420], hem: [718, 1060],
  },
  "tee-oversized": {
    neck: 96, neckY: 182, neckDepth: 50, shoulder: 245, shoulderY: 214,
    sleeve: [[905, 410], [820, 505]], armpit: [752, 446], hem: [756, 1092],
  },
  longsleeve: {
    neck: 100, neckY: 190, neckDepth: 52, shoulder: 205, shoulderY: 222,
    sleeve: [[822, 420], [908, 968], [832, 986]], armpit: [722, 482], hem: [718, 1062],
  },
  sweatshirt: {
    neck: 104, neckY: 196, neckDepth: 50, shoulder: 220, shoulderY: 232,
    sleeve: [[842, 430], [922, 960], [836, 982]], armpit: [738, 500], hem: [736, 1000],
  },
  hoodie: {
    neck: 108, neckY: 214, neckDepth: 40, shoulder: 225, shoulderY: 245,
    sleeve: [[846, 440], [926, 968], [838, 990]], armpit: [742, 508], hem: [740, 1004],
  },
  jacket: {
    neck: 92, neckY: 200, neckDepth: 30, shoulder: 228, shoulderY: 228,
    sleeve: [[848, 430], [928, 984], [838, 1004]], armpit: [744, 500], hem: [748, 1060],
  },
};

function sleeveHemLines(s: TopSpec, p: Palette) {
  // stitched line parallel to the sleeve opening
  const pts = s.sleeve;
  const a = pts[pts.length - 2] ?? pts[0];
  const b = pts[pts.length - 1];
  const dx = s.armpit[0] - b[0], dy = s.armpit[1] - b[1];
  const len = Math.hypot(dx, dy);
  const off = 26;
  const ox = (dx / len) * off, oy = (dy / len) * off;
  const lineR = `M ${a[0] + ox} ${a[1] + oy} L ${b[0] + ox} ${b[1] + oy}`;
  const lineL = `M ${mx(a[0] + ox)} ${a[1] + oy} L ${mx(b[0] + ox)} ${b[1] + oy}`;
  return `<path d="${lineR} ${lineL}" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`;
}

function ribBand(x1: number, x2: number, y: number, h: number, p: Palette) {
  const lines: string[] = [];
  for (let x = x1 + 10; x < x2; x += 12) lines.push(`M ${x} ${y + 4} L ${x} ${y + h - 4}`);
  return `<path d="M ${x1} ${y} L ${x2} ${y}" stroke="${p.line}" stroke-width="3"/><path d="${lines.join(" ")}" stroke="${p.line}" stroke-width="2"/>`;
}

function cuffs(s: TopSpec, p: Palette) {
  const n = s.sleeve.length;
  const outer = s.sleeve[n - 2], inner = s.sleeve[n - 1];
  // cuff = band along the last 70px of the sleeve, approximated by a line across
  const t = 0.1;
  const prevOuter = s.sleeve[n - 3] ?? [500 + s.shoulder, s.shoulderY];
  const ax = outer[0] + (prevOuter[0] - outer[0]) * t;
  const ay = outer[1] + (prevOuter[1] - outer[1]) * t;
  const bx = inner[0] + (s.armpit[0] - inner[0]) * t;
  const by = inner[1] + (s.armpit[1] - inner[1]) * t;
  const d = `M ${ax} ${ay} L ${bx} ${by} M ${mx(ax)} ${ay} L ${mx(bx)} ${by}`;
  return `<path d="${d}" stroke="${p.line}" stroke-width="4" fill="none"/>`;
}

function wordmark(x: number, y: number, size: number, p: Palette, spacing = 0.18, opacity = 0.92) {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Arial Black','Helvetica Neue',Arial,sans-serif" font-weight="900" font-size="${size}" letter-spacing="${size * spacing}" fill="${p.ink}" opacity="${opacity}">VANTA</text>`;
}
function smallText(x: number, y: number, size: number, text: string, p: Palette, opacity = 0.85) {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Helvetica Neue',Arial,sans-serif" font-weight="700" font-size="${size}" letter-spacing="${size * 0.32}" fill="${p.ink}" opacity="${opacity}">${text}</text>`;
}

function backPrint(kind: BackPrint, cx: number, top: number, p: Palette) {
  switch (kind) {
    case "large":
      return wordmark(cx, top + 140, 92, p, 0.05) + smallText(cx, top + 188, 18, "BEYOND THE ORDINARY", p, 0.7);
    case "slogan":
      return (
        smallText(cx, top + 80, 30, "BEYOND", p) +
        smallText(cx, top + 122, 30, "THE", p) +
        smallText(cx, top + 164, 30, "ORDINARY", p) +
        smallText(cx, top + 220, 16, "VANTA — EST. 2024", p, 0.6)
      );
    case "small":
      return smallText(cx, top + 40, 18, "VANTA", p, 0.75);
    default:
      return "";
  }
}

function folds(p: Palette, paths: string[]) {
  return paths.map((d) => `<path d="${d}" stroke="${p.line}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join("");
}

function drawTop(kind: GarmentKind, view: "front" | "back", bp: BackPrint, p: Palette) {
  const spec = TOPS[kind]!;
  const back = view === "back";
  const body = topPath(spec, back);
  const parts: string[] = [];
  let behind = "";
  let top = "";

  if (kind === "hoodie") {
    const hood = back
      ? `M 360 280 C 340 150 400 70 500 66 C 600 70 660 150 640 280 C 600 330 400 330 360 280 Z`
      : `M 372 250 C 352 130 410 70 500 66 C 590 70 648 130 628 250 Z`;
    behind = `<path d="${hood}" fill="${p.dark}"/>`;
    if (!back) {
      top += `<path d="M 410 246 C 400 150 600 150 590 246 C 560 296 440 296 410 246 Z" fill="${p.inner}"/><path d="M 410 246 C 440 300 560 300 590 246" stroke="${p.dark}" stroke-width="14" fill="none"/>`;
      top += `<path d="M 466 292 C 462 340 458 380 454 432 M 534 292 C 538 340 542 380 546 432" stroke="${p.ink}" stroke-opacity="0.65" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      top += `<rect x="446" y="428" width="16" height="30" rx="3" fill="${p.ink}" opacity="0.7"/><rect x="538" y="428" width="16" height="30" rx="3" fill="${p.ink}" opacity="0.7"/>`;
      top += `<circle cx="466" cy="292" r="7" fill="${p.inner}" stroke="${p.stitch}" stroke-width="2"/><circle cx="534" cy="292" r="7" fill="${p.inner}" stroke="${p.stitch}" stroke-width="2"/>`;
      // kangaroo pocket
      parts.push(`<path d="M 352 700 L 648 700 L 700 905 L 300 905 Z" fill="${p.light}" stroke="${p.line}" stroke-width="3"/>`);
      parts.push(`<path d="M 356 712 L 644 712 M 304 893 L 696 893" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
      parts.push(`<path d="M 352 700 L 300 905 M 648 700 L 700 905" stroke="${p.line}" stroke-width="5"/>`);
    } else {
      parts.push(`<path d="M 500 70 L 500 300" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
    }
  }

  if (kind === "jacket") {
    if (!back) {
      // collar
      parts.push(`<path d="M 408 200 L 500 330 L 440 214 Z M 592 200 L 500 330 L 560 214 Z" fill="${p.inner}"/>`);
      parts.push(`<path d="M 408 200 L 372 300 L 500 332 Z" fill="${p.light}" stroke="${p.line}" stroke-width="3"/>`);
      parts.push(`<path d="M 592 200 L 628 300 L 500 332 Z" fill="${p.light}" stroke="${p.line}" stroke-width="3"/>`);
      // placket & snaps
      parts.push(`<path d="M 500 332 L 500 1064" stroke="${p.line}" stroke-width="4"/>`);
      parts.push(`<path d="M 522 340 L 522 1060" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
      for (let y = 390; y <= 980; y += 118) parts.push(`<circle cx="511" cy="${y}" r="11" fill="${p.ink}" opacity="0.55"/>`);
      // chest pockets with flaps
      for (const x of [330, 560]) {
        parts.push(`<rect x="${x}" y="440" width="110" height="130" fill="${p.light}" stroke="${p.line}" stroke-width="3"/>`);
        parts.push(`<path d="M ${x - 6} 432 L ${x + 116} 432 L ${x + 116} 478 L ${x + 55} 492 L ${x - 6} 478 Z" fill="${p.dark}" stroke="${p.line}" stroke-width="3"/>`);
        parts.push(`<circle cx="${x + 55}" cy="476" r="7" fill="${p.ink}" opacity="0.5"/>`);
      }
      parts.push(`<path d="M 260 1010 L 740 1010" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
    } else {
      parts.push(`<path d="M 408 200 C 440 186 560 186 592 200 L 600 236 C 560 222 440 222 400 236 Z" fill="${p.dark}" stroke="${p.line}" stroke-width="3"/>`);
      parts.push(`<path d="M 280 380 C 400 400 600 400 720 380" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`);
      parts.push(`<path d="M 260 1010 L 740 1010" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
    }
  }

  // neckline treatment
  if (kind !== "hoodie" && kind !== "jacket") {
    const n = spec.neck, y = spec.neckY;
    if (!back) {
      parts.push(`<path d="M ${500 - n} ${y} C ${500 - n + 30} ${y + spec.neckDepth}, ${500 + n - 30} ${y + spec.neckDepth}, ${500 + n} ${y} C ${500 + n - 40} ${y - 14}, ${500 - n + 40} ${y - 14}, ${500 - n} ${y} Z" fill="${p.inner}"/>`);
      const rib = kind === "sweatshirt" ? 26 : 16;
      parts.push(`<path d="M ${500 - n} ${y + 2} C ${500 - n + 30} ${y + spec.neckDepth + rib}, ${500 + n - 30} ${y + spec.neckDepth + rib}, ${500 + n} ${y + 2}" stroke="${p.dark}" stroke-width="${rib}" fill="none"/>`);
      parts.push(`<path d="M ${500 - n - 6} ${y + 10} C ${500 - n + 30} ${y + spec.neckDepth + rib + 12}, ${500 + n - 30} ${y + spec.neckDepth + rib + 12}, ${500 + n + 6} ${y + 10}" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`);
    } else {
      parts.push(`<path d="M ${500 - n} ${y + 4} C ${500 - n + 30} ${y + 30}, ${500 + n - 30} ${y + 30}, ${500 + n} ${y + 4}" stroke="${p.dark}" stroke-width="16" fill="none"/>`);
    }
  }

  // armhole seams
  const sh: Pt = [500 + spec.shoulder, spec.shoulderY];
  const ap = spec.armpit;
  const seam = `M ${sh[0] - 6} ${sh[1] + 4} Q ${sh[0] + 12} ${(sh[1] + ap[1]) / 2} ${ap[0]} ${ap[1]}`;
  const seamL = `M ${mx(sh[0] - 6)} ${sh[1] + 4} Q ${mx(sh[0] + 12)} ${(sh[1] + ap[1]) / 2} ${mx(ap[0])} ${ap[1]}`;
  parts.push(`<path d="${seam} ${seamL}" stroke="${p.line}" stroke-width="3" fill="none"/>`);

  // hems & cuffs
  const hemY = spec.hem[1];
  if (kind === "sweatshirt" || kind === "hoodie") {
    parts.push(ribBand(mx(spec.hem[0]) + 2, spec.hem[0] - 2, hemY - 70, 74, p));
    parts.push(cuffs(spec, p));
  } else if (kind === "longsleeve") {
    parts.push(cuffs(spec, p));
    parts.push(`<path d="M ${mx(spec.hem[0]) + 4} ${hemY - 22} C 400 ${hemY - 10}, 600 ${hemY - 10}, ${spec.hem[0] - 4} ${hemY - 22}" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`);
  } else if (kind !== "jacket") {
    parts.push(sleeveHemLines(spec, p));
    parts.push(`<path d="M ${mx(spec.hem[0]) + 4} ${hemY - 22} C 400 ${hemY - 10}, 600 ${hemY - 10}, ${spec.hem[0] - 4} ${hemY - 22}" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`);
  }

  // folds for a natural flat-lay feel
  parts.push(folds(p, [`M 380 ${hemY - 260} C 420 ${hemY - 200}, 430 ${hemY - 120}, 420 ${hemY - 60}`, `M 640 ${hemY - 420} C 610 ${hemY - 340}, 600 ${hemY - 260}, 615 ${hemY - 170}`]));

  // prints
  if (!back) {
    if (kind === "sweatshirt") parts.push(smallText(500, 400, 24, "VANTA", p, 0.8));
    else if (kind === "hoodie") parts.push(wordmark(500, 600, 46, p, 0.22, 0.85));
    else if (kind !== "jacket") parts.push(smallText(500, spec.neckY + 190, 22, "VANTA", p, 0.8));
  } else {
    const top = kind === "hoodie" ? 330 : kind === "jacket" ? 420 : spec.neckY + 110;
    parts.push(backPrint(bp, 500, top, p));
  }

  return { behind, body, details: parts.join(""), top };
}

/* ─────────────── Bottoms ─────────────── */

function drawBottom(kind: GarmentKind, view: "front" | "back", p: Palette) {
  const back = view === "back";
  const parts: string[] = [];
  let body: string;
  if (kind === "shorts") {
    body = "M 318 300 L 682 300 L 716 768 L 522 796 L 500 584 L 478 796 L 284 768 Z";
    parts.push(`<rect x="318" y="300" width="364" height="62" fill="${p.dark}"/>`);
    parts.push(ribBand(318, 682, 300, 62, p));
    if (!back) {
      parts.push(`<path d="M 476 362 C 470 400 462 440 458 470 M 524 362 C 530 400 538 440 542 470" stroke="${p.ink}" stroke-opacity="0.6" stroke-width="7" fill="none" stroke-linecap="round"/>`);
      parts.push(`<path d="M 350 372 C 380 420 392 470 388 520 M 650 372 C 620 420 608 470 612 520" stroke="${p.line}" stroke-width="4" fill="none"/>`);
      parts.push(smallText(386, 720, 16, "VANTA", p, 0.7));
    } else {
      parts.push(`<rect x="560" y="420" width="96" height="110" fill="${p.light}" stroke="${p.line}" stroke-width="3"/><path d="M 556 414 L 660 414 L 660 452 L 556 452 Z" fill="${p.dark}" stroke="${p.line}" stroke-width="3"/>`);
      parts.push(`<path d="M 500 362 L 500 584" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
    }
    parts.push(`<path d="M 290 742 L 478 770 M 522 770 L 710 742" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
    return { behind: "", body, details: parts.join("") };
  }

  body = "M 318 110 L 682 110 L 696 520 L 712 1150 L 526 1162 L 500 548 L 474 1162 L 288 1150 L 304 520 Z";
  parts.push(`<rect x="318" y="110" width="364" height="64" fill="${p.dark}"/>`);
  if (kind === "sweatpant") {
    parts.push(ribBand(318, 682, 110, 64, p));
    parts.push(`<rect x="292" y="1078" width="182" height="74" fill="${p.dark}"/><rect x="526" y="1078" width="184" height="74" fill="${p.dark}"/>`);
    parts.push(ribBand(292, 474, 1078, 74, p) + ribBand(526, 710, 1078, 74, p));
    if (!back) {
      parts.push(`<path d="M 478 174 C 472 220 466 262 462 300 M 522 174 C 528 220 534 262 538 300" stroke="${p.ink}" stroke-opacity="0.6" stroke-width="7" fill="none" stroke-linecap="round"/>`);
      parts.push(`<path d="M 344 186 C 378 250 392 310 386 372 M 656 186 C 622 250 608 310 614 372" stroke="${p.line}" stroke-width="4" fill="none"/>`);
      parts.push(smallText(400, 470, 16, "VANTA", p, 0.7));
    }
  } else {
    // cargo: belt loops, fly, cargo pockets
    for (const x of [340, 420, 580, 660]) parts.push(`<rect x="${x - 7}" y="104" width="14" height="78" fill="${p.dark}" stroke="${p.line}" stroke-width="2"/>`);
    parts.push(`<path d="M 318 178 L 682 178" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
    if (!back) {
      parts.push(`<path d="M 500 178 L 500 420 C 500 450 520 460 540 450" stroke="${p.line}" stroke-width="3.5" fill="none"/><path d="M 528 178 L 528 416" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
      parts.push(`<circle cx="500" cy="146" r="12" fill="${p.ink}" opacity="0.5"/>`);
      parts.push(`<path d="M 330 190 C 360 240 380 280 384 330 M 670 190 C 640 240 620 280 616 330" stroke="${p.line}" stroke-width="4" fill="none"/>`);
    } else {
      parts.push(`<rect x="356" y="250" width="110" height="128" fill="${p.light}" stroke="${p.line}" stroke-width="3"/><rect x="534" y="250" width="110" height="128" fill="${p.light}" stroke="${p.line}" stroke-width="3"/>`);
      parts.push(`<path d="M 380 186 C 430 206 570 206 620 186" stroke="${p.line}" stroke-width="3" fill="none"/>`);
    }
    for (const x of [296, 584]) {
      const cx = x === 296 ? 296 : 584;
      parts.push(`<rect x="${cx}" y="610" width="120" height="170" fill="${p.light}" stroke="${p.line}" stroke-width="3"/>`);
      parts.push(`<path d="M ${cx - 4} 600 L ${cx + 124} 600 L ${cx + 124} 650 L ${cx - 4} 650 Z" fill="${p.dark}" stroke="${p.line}" stroke-width="3"/>`);
      parts.push(`<path d="M ${cx + 60} 652 L ${cx + 60} 780" stroke="${p.line}" stroke-width="3"/>`);
    }
    parts.push(`<path d="M 290 1120 L 474 1130 M 526 1130 L 710 1120" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
  }
  parts.push(folds(p, ["M 400 760 C 410 860 405 960 396 1050", "M 610 820 C 600 900 604 980 612 1060"]));
  parts.push(`<path d="M 500 548 L 500 ${back ? 178 : 450}" stroke="${p.line}" stroke-width="3"/>`);
  return { behind: "", body, details: parts.join("") };
}

/* ─────────────── Accessories ─────────────── */

function drawCap(view: "front" | "back", p: Palette) {
  const parts: string[] = [];
  const crown = "M 262 690 C 262 420 370 330 500 330 C 630 330 738 420 738 690 Z";
  let behind = "";
  let top = "";
  if (view === "front") {
    parts.push(`<path d="M 500 330 C 440 420 400 560 392 690 M 500 330 C 560 420 600 560 608 690" stroke="${p.line}" stroke-width="3.5" fill="none"/>`);
    parts.push(`<path d="M 500 334 C 446 424 408 562 400 690 M 500 334 C 554 424 592 562 600 690" stroke="${p.stitch}" stroke-width="2" stroke-dasharray="6 6" fill="none"/>`);
    parts.push(`<circle cx="500" cy="334" r="16" fill="${p.dark}" stroke="${p.line}" stroke-width="3"/>`);
    parts.push(`<circle cx="330" cy="470" r="7" fill="${p.inner}"/><circle cx="670" cy="470" r="7" fill="${p.inner}"/>`);
    parts.push(smallText(500, 560, 30, "VANTA", p, 0.85));
    top = `<path d="M 222 692 C 320 650 680 650 778 692 C 770 810 610 860 500 860 C 390 860 230 810 222 692 Z" fill="${p.dark}" stroke="${p.line}" stroke-width="3"/><path d="M 250 712 C 340 680 660 680 750 712" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/><path d="M 262 740 C 350 710 650 710 738 740" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`;
  } else {
    behind = `<path d="M 232 676 C 330 640 670 640 768 676 C 760 720 240 720 232 676 Z" fill="${p.dark}"/>`;
    parts.push(`<path d="M 500 330 L 500 560" stroke="${p.line}" stroke-width="3.5"/>`);
    parts.push(`<path d="M 420 690 C 420 600 580 600 580 690 Z" fill="${BG}"/>`);
    parts.push(`<rect x="404" y="606" width="192" height="30" fill="${p.dark}" stroke="${p.line}" stroke-width="2"/>`);
    parts.push(`<rect x="520" y="598" width="40" height="46" rx="4" fill="none" stroke="#9A9A96" stroke-width="7"/>`);
    parts.push(`<circle cx="500" cy="334" r="16" fill="${p.dark}" stroke="${p.line}" stroke-width="3"/>`);
  }
  return { behind, body: crown, details: parts.join(""), top };
}

function drawBag(view: "front" | "back", p: Palette) {
  const parts: string[] = [];
  const body = "M 270 640 C 270 560 360 520 500 520 C 640 520 730 560 730 640 L 730 860 C 730 920 690 946 630 946 L 370 946 C 310 946 270 920 270 860 Z";
  const behind = `<path d="M 300 620 C 230 240 770 240 700 620" stroke="${p.dark}" stroke-width="48" fill="none" stroke-linecap="round"/><path d="M 300 620 C 230 240 770 240 700 620" stroke="${p.stitch}" stroke-width="2" stroke-dasharray="7 6" fill="none"/><rect x="606" y="300" width="58" height="74" rx="8" fill="#2a2a2a" transform="rotate(32 635 337)"/>`;
  if (view === "front") {
    parts.push(`<path d="M 300 610 C 380 572 620 572 700 610" stroke="${p.inner}" stroke-width="8" fill="none"/>`);
    parts.push(`<rect x="660" y="590" width="16" height="54" rx="6" fill="${p.ink}" opacity="0.6" transform="rotate(-18 668 617)"/>`);
    parts.push(`<rect x="330" y="700" width="340" height="190" rx="36" fill="${p.light}" stroke="${p.line}" stroke-width="3"/>`);
    parts.push(`<path d="M 356 740 L 644 740" stroke="${p.inner}" stroke-width="6"/><rect x="612" y="738" width="12" height="42" rx="5" fill="${p.ink}" opacity="0.6"/>`);
    parts.push(smallText(500, 840, 22, "VANTA", p, 0.8));
  } else {
    for (let y = 640; y <= 880; y += 40) parts.push(`<path d="M 300 ${y} L 700 ${y}" stroke="${p.line}" stroke-width="3"/>`);
    parts.push(`<rect x="320" y="620" width="360" height="290" rx="40" fill="none" stroke="${p.stitch}" stroke-width="2.5" stroke-dasharray="7 6"/>`);
  }
  return { behind, body, details: parts.join("") };
}

/* ─────────────── Compose ─────────────── */

function render(kind: GarmentKind, view: "front" | "back", bp: BackPrint, hex: string) {
  const p = palette(hex);
  let art: { behind: string; body: string; details: string; top?: string };
  if (kind === "cap") art = drawCap(view, p);
  else if (kind === "bag") art = drawBag(view, p);
  else if (kind === "cargo" || kind === "sweatpant" || kind === "shorts") art = drawBottom(kind, view, p);
  else art = drawTop(kind, view, bp, p);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.07"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></linearGradient>
<radialGradient id="r" cx="0.42" cy="0.32" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0.10"/></radialGradient>
<radialGradient id="bg" cx="0.5" cy="0.42" r="0.8"><stop offset="0" stop-color="#EFEFED"/><stop offset="1" stop-color="${BG}"/></radialGradient>
<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000" flood-opacity="0.16"/></filter>
<clipPath id="c"><path d="${art.body}"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<g filter="url(#s)">${art.behind}<path d="${art.body}" fill="${p.base}"/></g>
<g clip-path="url(#c)">${art.details}<rect width="${W}" height="${H}" fill="url(#v)"/><rect width="${W}" height="${H}" fill="url(#r)"/></g>
<path d="${art.body}" fill="none" stroke="${p.line}" stroke-width="2"/>
${art.top ?? ""}
</svg>`;
}

const outRoot = path.join(process.cwd(), "public/images/products");
let count = 0;
for (const product of seedProducts) {
  const dir = path.join(outRoot, product.slug);
  mkdirSync(dir, { recursive: true });
  for (const colorSlug of product.colors) {
    const color = seedColors.find((c) => c.slug === colorSlug)!;
    for (const view of ["front", "back"] as const) {
      writeFileSync(path.join(dir, `${colorSlug}-${view}.svg`), render(product.kind, view, product.backPrint, color.hex));
      count++;
    }
  }
}

// Category covers reuse a representative render.
console.log(`Generated ${count} product renders in ${path.relative(process.cwd(), outRoot)}`);
