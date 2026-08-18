import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

const BG = "#f7e3d8"
const INK = "#2b1710"
const RED = "#d6483f"
const CREAM_STRIPE = "#f7e3d8"

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 24, height: 22 }}>
          <div
            style={{
              position: "relative",
              width: 24,
              height: 8,
              background: INK,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              overflow: "hidden",
              display: "flex",
            }}
          >
            {[2, 8, 14, 20].map((x) => (
              <div
                key={x}
                style={{
                  position: "absolute",
                  top: -2,
                  left: x,
                  width: 3,
                  height: 12,
                  background: CREAM_STRIPE,
                  transform: "rotate(24deg)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              width: 24,
              height: 14,
              background: RED,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
