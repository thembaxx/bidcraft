/**
 * iOS only uses launch images with an exact device pixel size.
 * Keep the head links and PNG route driven by the same allow-listed sizes.
 * Android derives its native launch screen from the web manifest.
 */
export const iosSplashDevices = [
  { width: 320, height: 568, scale: 2 },
  { width: 375, height: 667, scale: 2 },
  { width: 414, height: 736, scale: 3 },
  { width: 375, height: 812, scale: 3 },
  { width: 414, height: 896, scale: 2 },
  { width: 414, height: 896, scale: 3 },
  { width: 360, height: 780, scale: 3 },
  { width: 390, height: 844, scale: 3 },
  { width: 393, height: 852, scale: 3 },
  { width: 428, height: 926, scale: 3 },
  { width: 430, height: 932, scale: 3 },
  { width: 402, height: 874, scale: 3 },
  { width: 440, height: 956, scale: 3 },
  { width: 768, height: 1024, scale: 2 },
  { width: 810, height: 1080, scale: 2 },
  { width: 820, height: 1180, scale: 2 },
  { width: 834, height: 1112, scale: 2 },
  { width: 834, height: 1194, scale: 2 },
  { width: 1024, height: 1366, scale: 2 },
] as const;

export const iosSplashLinks = iosSplashDevices.flatMap(({ width, height, scale }) => {
  const orientations =
    width >= 768 ? (["portrait", "landscape"] as const) : (["portrait"] as const);
  return orientations.flatMap((orientation) => {
    const pixelWidth = (orientation === "portrait" ? width : height) * scale;
    const pixelHeight = (orientation === "portrait" ? height : width) * scale;
    return (["light", "dark"] as const).map((mode) => ({
      href: `/pwa/splash?width=${pixelWidth}&height=${pixelHeight}&mode=${mode}&v=1`,
      media: `screen and (device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: ${orientation}) and (prefers-color-scheme: ${mode})`,
    }));
  });
});

export const allowedSplashSizes = new Set(
  iosSplashLinks.map(({ href }) => {
    const params = new URL(href, "https://bidcraft.invalid").searchParams;
    return `${params.get("width")}x${params.get("height")}`;
  }),
);
