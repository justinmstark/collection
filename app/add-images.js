const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");

const db = new PrismaClient();
const USER_ID = "cmt82g2f20000ri699aj17mcz";

const ITEMS = [
  { id: "cmtao62ml0005ttuonpivzhx3", query: "Copper Dog Speyside Blended Malt Whisky" },
  { id: "cmtao62mr000cttuob5jw7igo", query: "Jack Daniels American Single Malt Oloroso Sherry Cask" },
  { id: "cmtao62n4000jttuoffkc0bww", query: "North British 35 Year Old Single Grain Scotch Whisky" },
  { id: "cmtao62n7000qttuota3xqe5t", query: "Redbreast 10 Year Old Single Pot Still Distillery Edition" },
  { id: "cmtao62n9000xttuo38k8nsk2", query: "Lark Rare Seppeltsfield II Tasmanian Single Malt" },
];

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT ?? "http://minio:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});
const BUCKET = process.env.MINIO_BUCKET ?? "collection-images";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function searchMasterOfMalt(query) {
  const url = `https://www.masterofmalt.com/search/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const html = await res.text();
    // Find first product image
    const match = html.match(/class="[^"]*product[^"]*"[^>]*>[\s\S]*?<img[^>]+src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/)
      ?? html.match(/<img[^>]+src="(https:\/\/cdn\.masterofmalt\.com\/whiskies\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/)
      ?? html.match(/<img[^>]+src="(https:\/\/cdn\.masterofmalt\.com\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"[^>]+(?:alt|class)="[^"]*(?:bottle|product|whisky)[^"]*"/i);
    return match?.[1] ?? null;
  } catch { return null; }
}

async function searchWhiskyExchange(query) {
  const url = `https://www.thewhiskyexchange.com/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<img[^>]+src="(https:\/\/cdn\.thewhiskyexchange\.com\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/)
      ?? html.match(/<img[^>]+src="(https:\/\/[^"]+thewhiskyexchange[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/)
      ?? html.match(/data-src="(https:\/\/cdn\.thewhiskyexchange\.com\/[^"]+\.(?:jpg|jpeg|png))"/);
    return match?.[1] ?? null;
  } catch { return null; }
}

async function searchDuckDuckGo(query) {
  // Get vqd token
  try {
    const initRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
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
    const results = data.results ?? [];
    for (const r of results.slice(0, 5)) {
      if (r.image && /\.(jpg|jpeg|png|webp)/i.test(r.image)) return r.image;
    }
    return null;
  } catch { return null; }
}

async function downloadAndUpload(imageUrl, itemId) {
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  try {
    const res = await fetch(imageUrl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!ALLOWED.includes(ct)) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5000) return false; // skip tiny/broken images
    const key = `${USER_ID}/${itemId}/${randomUUID()}.${EXT[ct] ?? "jpg"}`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: ct }));
    await db.itemImage.create({ data: { collectionItemId: itemId, storageKey: key, isPrimary: true } });
    return key;
  } catch { return false; }
}

async function run() {
  for (const { id, query } of ITEMS) {
    console.log(`\nSearching: "${query}"`);
    let imageUrl = null;

    imageUrl = await searchWhiskyExchange(query);
    if (imageUrl) console.log(`  Found via The Whisky Exchange`);

    if (!imageUrl) {
      imageUrl = await searchMasterOfMalt(query);
      if (imageUrl) console.log(`  Found via Master of Malt`);
    }

    if (!imageUrl) {
      imageUrl = await searchDuckDuckGo(query);
      if (imageUrl) console.log(`  Found via DuckDuckGo`);
    }

    if (!imageUrl) { console.log(`  ✗ No image found`); continue; }

    console.log(`  URL: ${imageUrl.substring(0, 80)}...`);
    const key = await downloadAndUpload(imageUrl, id);
    if (key) console.log(`  ✓ Saved: ${key}`);
    else console.log(`  ✗ Failed to download/upload`);
  }
  await db.$disconnect();
}

run().catch((e) => { console.error(e); db.$disconnect(); process.exit(1); });
