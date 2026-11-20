import { ImageResponse } from "next/og";

export const alt = "VANTA — Beyond the ordinary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#000", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72 }}>
        <div style={{ fontSize: 28, letterSpacing: 2, opacity: 0.7 }}>Streetwear premium — São Paulo</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 230, fontWeight: 900, letterSpacing: -10, lineHeight: 0.9 }}>VANTA</div>
          <div style={{ fontSize: 44, marginTop: 24 }}>Beyond the ordinary.</div>
        </div>
      </div>
    ),
    size,
  );
}
