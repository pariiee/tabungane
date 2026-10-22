import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Sakune Sisfor — Platform Finansial & Kas Mahasiswa Kampus";
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

        {/* Top Rail */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Logo Glyph from icon.svg */}
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 256 256">
                <g fill="#0b0b0f">
                  <path d="M 176 96 L 154 74 L 102 74 L 80 96 L 80 114 L 116 132 L 116 110 L 98 101 L 98 96 L 150 96 L 162 108 Z" />
                  <path d="M 140 124 L 140 146 L 158 155 L 158 160 L 106 160 L 94 148 L 80 160 L 102 182 L 154 182 L 176 160 L 176 142 Z" />
                </g>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                }}
              >
                SAKUNE SISFOR
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontFamily: "monospace" }}>
                FAKULTAS ILMU KOMPUTER
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
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

        {/* Center Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            position: "relative",
            zIndex: 10,
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>Ekosistem Finansial Modern untuk Mahasiswa.</span>
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "rgba(255, 255, 255, 0.65)",
              lineHeight: 1.4,
              fontWeight: 400,
            }}
          >
            Kantong Sakune mandiri, kas kelas transparan, dan automasi mutasi QRIS real-time.
          </div>
        </div>

        {/* Bottom Feature Tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "24px",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", gap: "16px", fontFamily: "monospace", fontSize: "13px" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>[IMMUTABLE LEDGER]</span>
            <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>[KANTONG SAKUNE]</span>
            <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>[4-TIER RBAC]</span>
            <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>[ZERO DATA LEAK]</span>
          </div>

          <div style={{ fontSize: "13px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)" }}>
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
