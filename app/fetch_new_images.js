const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");

const db = new PrismaClient();
const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT ? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT ?? 9000}` : "http://minio:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  },
  forcePathStyle: true,
});
const BUCKET = process.env.MINIO_BUCKET ?? "collection-images";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const QUERIES = [
  "Morris Rutherglen Double Port Barrel Australian Single Malt Whisky",
  "Highland Park 16 Year Old Single Malt Scotch Whisky",
  "Old Kempton Classic Range Sherry Cask Single Malt Whisky Tasmania",
  "Fuji Single Malt Japanese Whisky Fuji Gotemba",
  "Yamazaki Distiller's Reserve Single Malt Japanese Whisky Suntory",
  "Hakushu Distiller's Reserve Single Malt Japanese Whisky Suntory",
  "Nikka Taketsuru Pure Malt Whisky NAS",
  "The Chita Suntory Grain Whisky",
  "Old Kempton Chardonnay Cask Special Release Tasmania",
  "Old Kempton Palo Cortado Special Release Tasmania",
  "Old Kempton Stout Cask Special Release Tasmania",
  "The Whisky Club Blended Scotch 20 Year Old",
  "Ballantine's Finest Scotch Whisky bottle",
  "Chivas Regal 18 Year Old Gold Signature Scotch Whisky",
  "Mars Iwai Tradition Japanese Whisky Shinshu",
  "Nikka Taketsuru Pure Malt 21 Year Old",
  "Balcones Montilla Texas Single Malt Triple Sherry Finished",
  "Jim Beam Devil's Cut Kentucky Straight Bourbon Whiskey",
  "Jim Beam Single Barrel Kentucky Straight Bourbon",
  "Nikka Gold and Gold Japanese Blended Whisky",
  "Fuji Single Blended Japanese Whisky Kirin",
  "Suntory Plum Liqueur Umeshu Brandy Base",
  "Shinobu Shin Blended Whisky Mizunara Oak Finish",
  "Kura The Whisky Rum Cask Finish Blended Malt",
];

async function searchWhiskyExchange(query) {
  try {
    const res = await fetch(`https://www.thewhiskyexchange.com/search?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return html.match(/<img[^>]+src="(https:\/\/cdn\.thewhiskyexchange\.com\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/)
      ?.[1] ?? null;
  } catch { return null; }
}

async function searchMasterOfMalt(query) {
  try {
    const res = await fetch(`https://www.masterofmalt.com/search/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return html.match(/<img[^>]+src="(https:\/\/cdn\.masterofmalt\.com\/whiskies\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/)
      ?.[1] ?? null;
  } catch { return null; }
}

async function searchDuckDuckGo(query) {
  try {
    const initRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000),
    });
    const initHtml = await initRes.text();
    const vqdMatch = initHtml.match(/vqd=["']?([^"'&]+)/);
    if (!vqdMatch) return null;
    const vqd = vqdMatch[1];
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&p=1&s=0&u=bing&f=,,,,,&l=us-en&vqd=${vqd}`,
      { headers: { "User-Agent": UA, Referer: "https://duckduckgo.com/" }, signal: AbortSignal.timeout(8000) }
    );
    if (!imgRes.ok) return null;
    const data = await imgRes.json();
    for (const r of (data.results ?? []).slice(0, 8)) {
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
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5000) return false;
    const key = `${userId}/${itemId}/${randomUUID()}.${EXT[ct] ?? "jpg"}`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: ct }));
    await db.itemImage.create({ data: { collectionItemId: itemId, storageKey: key, isPrimary: true } });
    return key;
  } catch { return false; }
}

async function run() {
  const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });

  // Get items without images in order of recent creation, matching query list
  const items = await db.collectionItem.findMany({
    where: { userId: user.id, images: { none: {} } },
    include: { product: true },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  console.log(`${items.length} items need images\n`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const name = item.product?.name ?? item.customName ?? "Unknown";
    const query = QUERIES[i] ?? name;

    console.log(`Searching: "${query}"`);
    let imageUrl = await searchWhiskyExchange(query);
    if (imageUrl) { console.log(`  → Whisky Exchange`); }
    if (!imageUrl) { imageUrl = await searchMasterOfMalt(query); if (imageUrl) console.log(`  → Master of Malt`); }
    if (!imageUrl) { imageUrl = await searchDuckDuckGo(query); if (imageUrl) console.log(`  → DuckDuckGo`); }

    if (!imageUrl) { console.log(`  ✗ No image found for: ${name}`); continue; }

    const key = await downloadAndUpload(imageUrl, item.id, user.id);
    console.log(key ? `  ✓ Saved: ${key.split("/").pop()}` : `  ✗ Download failed`);
    await new Promise(r => setTimeout(r, 800));
  }

  await db.$disconnect();
}

run().catch(e => { console.error(e.message); db.$disconnect(); process.exit(1); });
