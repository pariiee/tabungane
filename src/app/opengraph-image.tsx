import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "SAKUNE — In This Economy? Yuk Nabung";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f4f3ef",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Subtle Architectural Construction Grid (Brand Blueprint) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Construction Guide Axis Lines */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "220px",
            height: "1px",
            backgroundColor: "rgba(0, 0, 0, 0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "235px",
            height: "1px",
            backgroundColor: "rgba(0, 0, 0, 0.06)",
          }}
        />

        {/* Centerpiece Lockup: Big Logo + Big SAKUNE */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Brand Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
            }}
          >
            {/* Bold Sharp S Logo Glyph (Matching image_956f61) */}
            <svg width="150" height="150" viewBox="74 68 108 120">
              <g fill="#0b0b0f">
                <path d="M 176 96 L 154 74 L 102 74 L 80 96 L 80 114 L 116 132 L 116 110 L 98 101 L 98 96 L 150 96 L 162 108 Z" />
                <path d="M 140 124 L 140 146 L 158 155 L 158 160 L 106 160 L 94 148 L 80 160 L 102 182 L 154 182 L 176 160 L 176 142 Z" />
              </g>
            </svg>

            {/* Huge Bold Typography */}
            <span
              style={{
                fontSize: "152px",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                color: "#0b0b0f",
                lineHeight: 1,
              }}
            >
              SAKUNE
            </span>
          </div>

          {/* Tagline Subtitle Directly Below */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "26px",
                fontFamily: "monospace",
                letterSpacing: "0.26em",
                color: "#71717a",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              IN THIS ECONOMY? YUK NABUNG
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
