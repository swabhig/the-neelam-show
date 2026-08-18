import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

const BG = "#f7e3d8"
const INK = "#2b1710"
const RED = "#d6483f"
const CREAM_STRIPE = "#f7e3d8"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 135, height: 124 }}>
          <div
            style={{
              position: "relative",
              width: 135,
              height: 45,
              background: INK,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              overflow: "hidden",
              display: "flex",
            }}
          >
            {[10, 44, 78, 112].map((x) => (
              <div
                key={x}
                style={{
                  position: "absolute",
                  top: -12,
                  left: x,
                  width: 16,
                  height: 68,
                  background: CREAM_STRIPE,
                  transform: "rotate(24deg)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              width: 135,
              height: 79,
              background: RED,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
