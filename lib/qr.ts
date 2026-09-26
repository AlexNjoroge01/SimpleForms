// QR settings shared by the share page and its tests (§9.6). Colours are
// Design.md --text on white for maximum scan contrast; a 2-module quiet zone
// keeps it scannable when printed.
export const QR_OPTIONS = {
  margin: 2,
  errorCorrectionLevel: "M" as const,
  color: { dark: "#122119", light: "#FFFFFF" },
}
