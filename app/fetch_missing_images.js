const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");

const db = new PrismaClient();
const s3 = new S3Client({
  endpoint: "http://minio:9000",
  region: "us-east-1",
  credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin" },
  forcePathStyle: true,
});
const BUCKET = "collection-images";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const RETRIES = [
  { name: "Fuji Single Malt Japanese Whisky", queries: ["Kirin Fuji Gotemba single malt whisky 46%", "Fuji whisky bottle 700ml"] },
  { name: "Nikka Taketsuru Pure Malt", queries: ["Nikka Taketsuru NAS Pure Malt whisky bottle", "Taketsuru pure malt japanese blended malt"] },
  { name: "Old Kempton Palo Cortado Special Release", queries: ["Old Kempton palo cortado whisky 500ml Tasmania", "Old Kempton blue tin special release whisky"] },
  { name: "Balcones Montilla Texas Single Malt Triple Sherry Finished", queries: ["Balcones Montilla whisky bottle", "Balcones Texas whisky triple sherry"] },
  { name: "Shin Blended Whisky Mizunara Oak Finish", queries: ["Shinobu Shin blended whisky bottle mizunara", "Shin whisky Niigata mizunara oak"] },
];

async function tryDDG(query) {
  try {
    const initRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000),
    });
    const html = await initRes.text();
    const vqdMatch = html.match(/vqd=["']?([^"'&]+)/);
    if (!vqdMatch) return null;
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&p=1&s=0&u=bing&f=,,,,,&l=us-en&vqd=${vqdMatch[1]}`,
      { headers: { "User-Agent": UA, Referer: "https://duckduckgo.com/" }, signal: AbortSignal.timeout(8000) }
    );
    if (!imgRes.ok) return null;
    const data = await imgRes.json();
    for (const r of (data.results ?? []).slice(0, 10)) {
      if (r.image && /\.(jpg|jpeg|png|webp)/i.test(r.image)) return r.image;
    }
    return null;
  } catch { return null; }
}

async function downloadAndUpload(imageUrl, itemId, userId) {
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  try {
    const res = await fetch(imageUrl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!ALLOWED.includes(ct)) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) return false;
    const key = `${userId}/${itemId}/${randomUUID()}.${EXT[ct] ?? "jpg"}`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: ct }));
    await db.itemImage.create({ data: { collectionItemId: itemId, storageKey: key, isPrimary: true } });
    return key;
  } catch { return false; }
}

async function run() {
  const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });

  for (const { name, queries } of RETRIES) {
    const item = await db.collectionItem.findFirst({
      where: { userId: user.id, product: { name }, images: { none: {} } },
    });
    if (!item) { console.log(`SKIP (already has image or not found): ${name}`); continue; }

    console.log(`\nRetrying: ${name}`);
    let imageUrl = null;
    for (const q of queries) {
      imageUrl = await tryDDG(q);
      if (imageUrl) { console.log(`  → Found with: "${q}"`); break; }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!imageUrl) { console.log(`  ✗ Still no image`); continue; }
    const key = await downloadAndUpload(imageUrl, item.id, user.id);
    console.log(key ? `  ✓ ${key.split("/").pop()}` : `  ✗ Download failed`);
    await new Promise(r => setTimeout(r, 800));
  }

  await db.$disconnect();
}

run().catch(e => { console.error(e.message); db.$disconnect(); process.exit(1); });
