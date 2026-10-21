# Anatomy drawing kit

Source: https://github.com/wheresryan22/anatomy
Pinned commit: `1482e8469b0a9e0d8cc18ea2740a01423d29ae80`.
MIT © 2026 Ryan. See `LICENSE` in this directory.

The six ESM/CSS files are copied unchanged from upstream. Geometry, shading, camera projection, clipping and the audit come from this kit. Only CSS and generated SVG paths are used by the UI; the geometry and audit modules run in the authoring script.

Run `npm run anatomy:build` to regenerate `components/bid-anatomy/bench-art.json` and the standalone SVG in `public/anatomy`. Run `npm run anatomy:audit` to verify the 63-solid bench at 75 configurations, including every combination of raised/retracted stations. The application does not execute AI-generated code.
