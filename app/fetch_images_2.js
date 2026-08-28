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

const TARGET_NAMES = [
  "Glenmorangie The Quinta Ruban",
  "Glenmorangie Barrel Select Release 12 Calvados Cask",
  "Glenmorangie Barrel Select Release 12 Bourbon & Sherry Cask",
  "Glenmorangie Barrel Select Release 13",
  "The Glenlivet 14 Years First Fill American Oak",
  "The Glenlivet Groundbreaker Collection",
  "The Glenlivet Founder's Reserve",
  "Basil Hayden's Kentucky Straight Bourbon",
  "Beenleigh 5 Year Old Double Barrel Rum",
  "The Glenlivet Archive 21 Years",
  "Glen Grant 10 Years",
  "Glen Grant Aurora Wanderlust Collection",
  "Glen Grant 15 Years Batch Strength",
  "Glen Grant 13 Years Non-Chill Filtered",
];

const SEARCH_QUERIES = {
  "Glenmorangie The Quinta Ruban": "Glenmorangie Quinta Ruban Port Cask Single Malt Whisky bottle",
  "Glenmorangie Barrel Select Release 12 Calvados Cask": "Glenmorangie Barrel Select Release 12 Calvados Cask whisky bottle",
  "Glenmorangie Barrel Select Release 12 Bourbon & Sherry Cask": "Glenmorangie Barrel Select Release 12 Bourbon Sherry Cask whisky bottle",
  "Glenmorangie Barrel Select Release 13": "Glenmorangie Barrel Select Release 13 whisky bottle",
  "The Glenlivet 14 Years First Fill American Oak": "Glenlivet 14 Year First Fill American Oak Single Malt Scotch bottle",
  "The Glenlivet Groundbreaker Collection": "Glenlivet Groundbreaker Collection Single Malt Scotch Whisky bottle",
  "The Glenlivet Founder's Reserve": "Glenlivet Founder's Reserve Single Malt Scotch Whisky bottle",
  "Basil Hayden's Kentucky Straight Bourbon": "Basil Hayden Kentucky Straight Bourbon Whiskey bottle",
  "Beenleigh 5 Year Old Double Barrel Rum": "Beenleigh 5 Year Old Double Barrel Rum bottle",
  "The Glenlivet Archive 21 Years": "Glenlivet Archive 21 Year Single Malt Scotch Whisky bottle",
  "Glen Grant 10 Years": "Glen Grant 10 Year Single Malt Scotch Whisky bottle",
  "Glen Grant Aurora Wanderlust Collection": "Glen Grant Aurora Wanderlust Collection Scotch Whisky bottle",
  "Glen Grant 15 Years Batch Strength": "Glen Grant 15 Year Batch Strength Single Malt Scotch Whisky bottle",
  "Glen Grant 13 Years Non-Chill Filtered": "Glen Grant 13 Year Non-Chill Filtered Single Malt Scotch Whisky bottle",
};

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

  const items = await db.collectionItem.findMany({
    where: {
      userId: user.id,
      images: { none: {} },
      product: { name: { in: TARGET_NAMES } },
    },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`${items.length} new bottles need images\n`);
  let done = 0, failed = 0;

  for (const item of items) {
    const name = item.product?.name ?? "Unknown";
    const query = SEARCH_QUERIES[name] ?? `${name} whisky bottle`;

    process.stdout.write(`Searching: "${name}"... `);
    let imageUrl = await searchWhiskyExchange(query);
    if (imageUrl) { process.stdout.write("TWE "); }
    if (!imageUrl) { imageUrl = await searchMasterOfMalt(query); if (imageUrl) process.stdout.write("MoM "); }
    if (!imageUrl) { imageUrl = await searchDuckDuckGo(query); if (imageUrl) process.stdout.write("DDG "); }

    if (!imageUrl) { console.log(`✗ no image`); failed++; continue; }

    const key = await downloadAndUpload(imageUrl, item.id, user.id);
    if (key) { console.log(`✓`); done++; }
    else { console.log(`✗ download failed`); failed++; }

    await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`\nDone: ${done}, Failed: ${failed}`);
  await db.$disconnect();
}

run().catch(e => { console.error(e.message); db.$disconnect(); process.exit(1); });
