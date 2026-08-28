import sharp from "sharp";

export async function removeBackground(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data.buffer);

  // Sample corners to determine background color
  const corners = [0, (width - 1) * channels, (height - 1) * width * channels, ((height - 1) * width + width - 1) * channels];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const c of corners) { bgR += pixels[c]; bgG += pixels[c + 1]; bgB += pixels[c + 2]; }
  bgR = Math.round(bgR / 4); bgG = Math.round(bgG / 4); bgB = Math.round(bgB / 4);

  // If background is near-white, use white threshold; otherwise use sampled color
  const isWhiteBg = bgR > 200 && bgG > 200 && bgB > 200;
  const threshold = isWhiteBg ? 35 : 30;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const dist = isWhiteBg
      ? (255 - r + (255 - g) + (255 - b)) / 3
      : Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
    if (dist < threshold) {
      pixels[i + 3] = 0;
    } else if (dist < threshold * 2) {
      pixels[i + 3] = Math.round(((dist - threshold) / threshold) * 255);
    }
  }

  return sharp(Buffer.from(pixels.buffer as ArrayBuffer), { raw: { width, height, channels } }).png().toBuffer();
}
