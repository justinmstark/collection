const { PrismaClient } = require("@prisma/client");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const db = new PrismaClient();
const s3 = new S3Client({
  endpoint: "http://minio:9000",
  region: "us-east-1",
  credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin" },
  forcePathStyle: true,
});
const BUCKET = "collection-images";

async function removeBackground(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const pixels = new Uint8Array(data.buffer);
  const corners = [0, (width - 1) * channels, (height - 1) * width * channels, ((height - 1) * width + width - 1) * channels];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const c of corners) { bgR += pixels[c]; bgG += pixels[c + 1]; bgB += pixels[c + 2]; }
  bgR = Math.round(bgR / 4); bgG = Math.round(bgG / 4); bgB = Math.round(bgB / 4);
  const isWhiteBg = bgR > 200 && bgG > 200 && bgB > 200;
  const threshold = isWhiteBg ? 35 : 30;
  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const dist = isWhiteBg
      ? (255 - r + (255 - g) + (255 - b)) / 3
      : Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
    if (dist < threshold) pixels[i + 3] = 0;
    else if (dist < threshold * 2) pixels[i + 3] = Math.round(((dist - threshold) / threshold) * 255);
  }
  return sharp(Buffer.from(pixels.buffer), { raw: { width, height, channels } }).png().toBuffer();
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function run() {
  const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });

  // Find all images that don't already have _nobg in the key
  const images = await db.itemImage.findMany({
    where: {
      item: { userId: user.id },
      storageKey: { not: { contains: "_nobg" } },
    },
    include: { item: { include: { product: true } } },
  });

  console.log(`Found ${images.length} images without background removal\n`);

  let done = 0, failed = 0;
  for (const img of images) {
    const name = img.item.product?.name ?? img.item.customName ?? "Unknown";
    try {
      // Download original from MinIO
      const getRes = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: img.storageKey }));
      const originalBuf = await streamToBuffer(getRes.Body);

      // Remove background
      const nobgBuf = await removeBackground(originalBuf);

      // Upload _nobg version
      const nobgKey = img.storageKey.replace(/\.[^.]+$/, "") + "_nobg.png";
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: nobgKey, Body: nobgBuf, ContentType: "image/png" }));

      // Update the record to use the _nobg version
      await db.itemImage.update({ where: { id: img.id }, data: { storageKey: nobgKey } });

      console.log(`✓ ${name}`);
      done++;
    } catch (e) {
      console.log(`✗ ${name} — ${e.message}`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nDone: ${done}, Failed: ${failed}`);
  await db.$disconnect();
}

run().catch(e => { console.error(e.message); db.$disconnect(); process.exit(1); });
