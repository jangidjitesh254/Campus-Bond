/**
 * Formerly the two blurred colour blobs behind every screen. The Grove
 * design is a flat canvas, and a full-screen SVG with two radial gradients
 * on every screen was also the single most expensive thing to draw on
 * Android (each tab switch re-rasterised it). It now renders nothing; the
 * component is kept so the 29 screens that mount it need no edits.
 */
export default function AmbientGlow() {
  return null;
}
