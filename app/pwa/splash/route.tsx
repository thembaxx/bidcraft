import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { allowedSplashSizes } from "@/lib/pwa-splash";

// Match the existing small-size Bidcraft mark; keep this self-contained so
// installed iOS launch images can render without fetching external assets.
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="#F8F6EF"/><stop offset="1" stop-color="#DDFB82"/></linearGradient></defs><rect width="128" height="128" rx="30" fill="#101714"/><path d="M35 27h32c30 0 35 32 12 39 27 9 20 37-8 37H35V27Zm18 14v20h13c13 0 14-20 0-20H53Zm0 34v15h16c12 0 13-15 0-15H53Z" fill="url(#b)" fill-rule="evenodd"/><path d="m35 27 18 14v49l-18 13Z" fill="#168B7A"/></svg>`;
const markDataUrl = `data:image/svg+xml;base64,${Buffer.from(markSvg).toString("base64")}`;

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const width = Number(searchParams.get("width"));
  const height = Number(searchParams.get("height"));
  const mode = searchParams.get("mode");
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    !allowedSplashSizes.has(`${width}x${height}`) ||
    (mode !== "light" && mode !== "dark")
  ) {
    return NextResponse.json({ error: "Unsupported splash dimensions or theme." }, { status: 400 });
  }

  const dark = mode === "dark";
  const compact = Math.min(width, height);
  const logoSize = Math.round(Math.min(260, compact * 0.23));
  const wordmarkSize = Math.round(Math.min(78, compact * 0.071));
  const detailSize = Math.round(Math.min(27, compact * 0.023));
  const ink = dark ? "#F8F6EF" : "#101714";
  const paper = dark ? "#101714" : "#F8F6EF";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: paper,
        color: ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          gap: Math.round(logoSize * 0.18),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={markDataUrl}
          width={logoSize}
          height={logoSize}
          alt=""
          style={{ borderRadius: Math.round(logoSize * 0.23) }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: wordmarkSize,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          bidcraft<span style={{ color: dark ? "#DDFB82" : "#168B7A" }}>.</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: detailSize,
            fontWeight: 500,
            letterSpacing: 0.5,
            color: dark ? "#BDC9C0" : "#52615A",
          }}
        >
          Make every bid count.
        </div>
      </div>
    </div>,
    {
      width,
      height,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
    },
  );
}
