import jsQR from "jsqr"
import { PNG } from "pngjs"
import QRCode from "qrcode"
import { describe, expect, it } from "vitest"

import { QR_OPTIONS } from "@/lib/qr"

// Phase 5: the QR code on the share page must scan back to the public URL.
describe("share QR code", () => {
  it.each(["https://simpleforms.co.ke/f/Ab3dEf7h", "http://localhost:3000/f/xYz23456"])("decodes to %s", async (url) => {
    for (const width of [480, 1024]) {
      const dataUrl = await QRCode.toDataURL(url, { ...QR_OPTIONS, width })
      const png = PNG.sync.read(Buffer.from(dataUrl.split(",")[1], "base64"))
      const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
      expect(decoded?.data).toBe(url)
    }
  })

  it("renders a standalone SVG", async () => {
    const svg = await QRCode.toString("https://simpleforms.co.ke/f/Ab3dEf7h", { ...QR_OPTIONS, type: "svg" })
    expect(svg).toMatch(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)
    expect(svg).toContain("#122119")
  })
})
