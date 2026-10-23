import { mkdirSync, writeFileSync } from "node:fs";
import * as k from "../vendor/anatomy/iso-kit.mjs";
import * as G from "../vendor/anatomy/lathe.mjs";
import * as A from "../vendor/anatomy/audit.mjs";

// Figure: a six-station inspection jig. Review retracts a station's measuring pin.
// Parts: eight feet, bed, six station plates, twelve guides, six rear supports,
// six bearing housings, six sliding pins, six caps, a bridge, tray and three
// sheets, two tray stops, a ruler, nameplate, and three gauge bodies (63 solids).
const width = 780,
  height = 440;
const bed = { x: -160, y: -75, w: 320, d: 145, r: 9 };
const centres = [-105, -63, -21, 21, 63, 105];
const P = k.fitProjection(k.boxCorners(bed, -18, 72), width, height, {
  pad: 62,
  azimuth: 48,
  elevation: 33,
});
const R = A.recorder(P);
const at = (point) => k.iso(point, P);
const line = (d, tone = "lo", free = false) => k.lineSvg(d, { tone, free });
const dots = (points) => k.dotsSvg(points.map(at), { size: 0.5 });
const meta = (name, extra = {}) => ({ name, ...extra });
let solids = 0;
function put(name, piece, centre, paths, shape, extra = {}) {
  solids++;
  const { inner = "", move = [0, 0, 0], clip, ...style } = extra;
  R.put({
    name,
    piece,
    at: centre,
    move,
    svg: k.solidSvg(paths, { tone: "mid", ...style, inner }),
    shapes: [R.solid(shape)],
    ...(clip ? { clip } : {}),
  });
}
function slab(name, piece, plan, z, h, extra = {}) {
  put(
    name,
    piece,
    [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
    k.slabOf(plan, z, h, P, 6, 0.6),
    A.slab(plan, z, h, meta(name, extra.ground ? { ground: true } : {}), 6),
    extra,
  );
}
function cylinder(name, piece, x, y, radius, z, h, extra = {}) {
  put(
    name,
    piece,
    [x, y, z + h / 2],
    k.cylinder(x, y, radius, z, h, P, 40, 0.35),
    A.cylinder(x, y, radius, z, h, meta(name, extra.ground ? { ground: true } : {})),
    extra,
  );
}
for (const [i, [x, y]] of k.corners(bed, 20).entries()) {
  cylinder(`stand.foot-${i}`, "base", x, y, 8, -18, 3, { tone: "lo", ground: true });
  cylinder(`stand.pad-${i}`, "base", x, y, 6, -15, 5, { tone: "lo" });
}
slab("bed", "base", bed, -10, 10, {
  tone: "mid",
  inner:
    line(k.planOutline(k.insetPlan(bed, 5), 0, P), "faint") +
    dots(k.corners(bed, 11).map(([x, y]) => [x, y, 0])),
});
for (const [index, x] of centres.entries()) {
  const piece = `station-${index}`;
  const plan = { x: x - 14, y: -43, w: 28, d: 40, r: 2 };
  slab(`${piece}.plate`, piece, plan, 0, 3, {
    inner: dots([
      [x - 10, -7, 3],
      [x + 10, -7, 3],
    ]),
  });
  slab(`${piece}.back`, piece, { x: x - 13, y: -43, w: 26, d: 4, r: 1 }, 3, 59);
  for (const side of [-1, 1])
    slab(
      `${piece}.guide-${side}`,
      piece,
      { x: x + (side < 0 ? -12 : 9), y: -39, w: 3, d: 26, r: 0.6 },
      3,
      54,
      { tone: "mid" },
    );
  cylinder(`${piece}.bearing`, piece, x, -24, 7, 3, 9, {
    inner: line(k.ring(x, -24, 2.5, 12, P, 32), "hi"),
  });
  const frame = G.frameAlong([x, -24, 0], [0, 0, 1]);
  const rod = G.rodOut(frame, 12, 54, 2.5, P, { stroke: 18, steps: 32 });
  put(
    `${piece}.pin`,
    piece,
    [x, -24, 33],
    rod.paths,
    A.slide(frame, 12, 54, 2.5, meta(`${piece}.pin`)),
    { tone: "hi", crease: "none", move: [0, 0, -18], clip: rod.clip },
  );
  slab(`${piece}.cap`, piece, { x: x - 8, y: -30, w: 16, d: 12, r: 1.5 }, 54, 5, {
    tone: "hi",
    move: [0, 0, -18],
    inner: line(k.planOutline({ x: x - 5, y: -27, w: 10, d: 6, r: 1 }, 59, P), "faint"),
  });
}
slab("bridge", "frame", { x: -126, y: -43, w: 252, d: 4, r: 1 }, 62, 4, {
  inner: dots(centres.map((x) => [x, -41, 66])),
});
const tray = { x: -112, y: 12, w: 192, d: 46, r: 3 };
slab("tray", "tray", tray, 0, 2, { tone: "lo" });
for (let index = 0; index < 3; index++) {
  const sheet = { x: -105 + index * 0.6, y: 17 + index * 0.6, w: 178, d: 34, r: 1 };
  const z = 2 + index * 0.35;
  const printed =
    index === 2
      ? [0, 1, 2, 3]
          .map((row) =>
            line(
              k.lineOnTop([-94, 24 + row * 5], [row === 3 ? -14 : 54, 24 + row * 5], z + 0.35, P),
              "lo",
              true,
            ),
          )
          .join("")
      : "";
  slab(`tray.sheet-${index}`, "tray", sheet, z, 0.35, {
    tone: "hi",
    crease: "none",
    inner: printed,
  });
}
for (const x of [-112, 77])
  slab(`tray.stop-${x}`, "tray", { x, y: 13, w: 3, d: 44, r: 0.6 }, 2, 5, {
    inner: dots([
      [x + 1.5, 18, 7],
      [x + 1.5, 51, 7],
    ]),
  });
const ruler = { x: -110, y: 62, w: 218, d: 5, r: 0.7 };
const ticks = k.topTicks(-106, 104, 5, 5, 62, 0.6, [2, 4], P);
slab("ruler", "base", ruler, 0, 0.6, {
  tone: "lo",
  crease: "none",
  inner: line(ticks.minor, "lo") + line(ticks.major, "mid"),
});
const badge = { x: -148, y: 20, w: 26, d: 31, r: 1.5 };
slab("nameplate", "base", badge, 0, 0.7, {
  tone: "lo",
  inner:
    line(k.planOutline(k.insetPlan(badge, 2), 0.7, P), "faint") +
    k.faceTextSvg(k.topMatrix([-135, 37], 0.7, P), "BC / 01", { size: 3, anchor: "middle" }),
});
cylinder("gauge.mount", "gauge", 129, 40, 19, 0, 3);
cylinder("gauge.bezel", "gauge", 129, 40, 17, 3, 7, {
  tone: "hi",
  inner: line(k.knurl(129, 40, 17, 7, 10, 60, P), "lo"),
});
const radial = k.radialTicks(129, 40, 14, 24, 6, 10.5, [1.5, 3], P);
cylinder("gauge.face", "gauge", 129, 40, 15.5, 10, 0.5, {
  crease: "none",
  inner:
    line(k.ring(129, 40, 14, 10.5, P, 64), "faint") +
    line(radial.minor, "lo") +
    line(radial.major, "hi"),
});

const states = [
  ...Array.from({ length: 11 }, (_, index) => index / 10),
  ...Array.from({ length: 64 }, (_, mask) => ({
    label: `pins-${mask}`,
    shares: Object.fromEntries(
      centres.map((_, index) => [`station-${index}`, (mask >> index) & 1]),
    ),
  })),
];
A.settle(R, P, { states });
R.items.sort((a, b) => a.key - b.key);
const motion = k.iso([0, 0, -18], { ...P, origin: [0, 0] });
const art = {
  width,
  height,
  solids,
  motion,
  gaugeMatrix: k.topMatrix([129, 40], 10.6, P),
  halo: k.haloOf(bed, -18, 10, P),
  pins: centres.map((x) => at([x, -24, 59])),
  items: R.items.map(({ name, piece, svg, clip, move }) => ({
    name,
    piece,
    svg,
    ...(clip ? { clip } : {}),
    moving: move[2] !== 0,
  })),
};
mkdirSync("components/bid-anatomy", { recursive: true });
writeFileSync("components/bid-anatomy/bench-art.json", JSON.stringify(art) + "\n");
const staticSvg = R.items
  .map((item) =>
    item.clip
      ? `<defs><clipPath id="clip-${item.name}"><path d="${item.clip}"/></clipPath></defs><g clip-path="url(#clip-${item.name})">${item.svg}</g>`
      : item.svg,
  )
  .join("");
mkdirSync("public/anatomy", { recursive: true });
writeFileSync(
  "public/anatomy/inspection-bench.svg",
  k.figureSvg({
    width,
    height,
    label: "Bidcraft inspection bench, six measuring stations, proposal tray and review gauge.",
    body: `<path class="iso-halo" d="${art.halo}"/>${staticSvg}`,
    standalone: "light",
  }),
);
console.log(
  `Bid Anatomy: ${solids} solids, ${R.items.length} ordered parts, ${states.length} checked poses.`,
);
A.auditOrExit(R, P, { frames: states, apart: true });
