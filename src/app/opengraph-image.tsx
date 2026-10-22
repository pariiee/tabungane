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
          justifyContent: "space-between",
          backgroundColor: "#0e0f12",
          color: "#f4f3ef",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background Grid Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Minimal Outer Border Frame */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            pointerEvents: "none",
          }}
        />

        {/* Top Rail */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 10,
            padding: "0 20px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontFamily: "monospace",
              letterSpacing: "0.2em",
              color: "rgba(255, 255, 255, 0.4)",
              textTransform: "uppercase",
            }}
          >
            FAKULTAS ILMU KOMPUTER · SISTEM INFORMASI
          </div>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
              }}
            />
            LIVE PLATFORM
          </div>
        </div>

        {/* Center Main Identity (Logo beside SAKUNE, Tagline below) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 10,
            gap: "24px",
          }}
        >
          {/* Logo + SAKUNE Brandmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "26px",
            }}
          >
            {/* Crisp Official Logo */}
            <div
              style={{
                width: "92px",
                height: "92px",
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              <svg width="56" height="56" viewBox="0 0 256 256">
                <g fill="#0b0b0f">
                  <path d="M 176 96 L 154 74 L 102 74 L 80 96 L 80 114 L 116 132 L 116 110 L 98 101 L 98 96 L 150 96 L 162 108 Z" />
                  <path d="M 140 124 L 140 146 L 158 155 L 158 160 L 106 160 L 94 148 L 80 160 L 102 182 L 154 182 L 176 160 L 176 142 Z" />
                </g>
              </svg>
            </div>

            <span
              style={{
                fontSize: "88px",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              SAKUNE
            </span>
          </div>

          {/* Subtitle Pill / Tagline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 24px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontFamily: "monospace",
                letterSpacing: "0.14em",
                color: "rgba(255, 255, 255, 0.85)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              FINANCIAL FREEDOM · IN THIS ECONOMY? YUK NABUNG
            </span>
          </div>
        </div>

        {/* Bottom Technical HUD Footer */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 10,
            padding: "0 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "16px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontFamily: "monospace",
              color: "rgba(255, 255, 255, 0.4)",
              letterSpacing: "0.08em",
            }}
          >
            PORTAL KAS &amp; TABUNGAN MAHASISWA
          </div>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "monospace",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            sakune.sisfor · 2026
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
