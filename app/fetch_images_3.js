const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const db = new PrismaClient();
const s3 = new S3Client({
  endpoint: "http://minio:9000",
  region: "us-east-1",
  credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin" },
  forcePathStyle: true,
});
const BUCKET = "collection-images";

const NEW_BOTTLES = [
  "Lagavulin 11 Year Old Offerman Edition Charred Oak Cask",
  "GlenDronach Original 12 Year Old",
  "GlenDronach 2013 Vintage 11 Year Old PX Cask",
  "GlenDronach Cask Strength Batch 11",
  "Glenglassaugh 12 Year Old Pedro Ximenez Cask",
  "Glengoyne 12 Year Old First Fill Edition",
  "Laphroaig PX Cask Triple Matured",
  "Laphroaig An Cuan Mòr",
  "A Dram for Party Animals",
  "Glenmorangie The Accord 12 Year Old",
  "Glenfiddich Special Old Reserve",
  "The Macallan Whisky Maker's Edition",
  "The Lakes Whiskymaker's Editions Voyage",
  "The Lakes Chocolatier",
  "Talisker x Parley Wilder Seas",
  "Talisker Skye",
  "Talisker Dark Storm",
  "Aberlour 15 Year Old Double Cask Matured",
  "Glenmorangie Dornoch Limited Edition",
  "Dalwhinnie Winter's Frost Game of Thrones House Stark",
  "Ardbeg Smoketrails Limited Edition",
  "Grant's Ale Cask Finish Edition",
  "Glen Scotia 2013 Vintage Bordeaux Red Wine Cask",
  "Jura The Road",
  "Johnnie Walker Gold Label Reserve 18 Year Old",
  "Johnnie Walker Green Label 15 Year Old",
  "Johnnie Walker Blue Label",
  "Hellyers Road Original 12 Year Old",
  "Dog & Gun Whisky",
  "Coastal Stone Ginger Beer Cask #1",
  "Coastal Stone Bourbon Cask Element Series",
  "Pōkeno Origin",
  "Jameson Triple Triple",
  "Jameson Black Barrel",
  "Jameson Gold Reserve",
  "Jameson Caskmates Stout Edition",
  "Amrut Indian Single Malt",
  "Amrut Nativity",
  "Amrut Fusion",
  "Paul John Port Select Cask",
  "Hibiki 12 Year Old",
  "Suntory Royal Limited Design Bottle",
  "The Kyoto Malt Whisky",
  "The Kurayoshi Pure Malt Sherry Cask",
  "Suntory World Whisky Ao",
  "Nikka Whisky From The Barrel",
  "Nikka Coffey Malt Whisky",
  "Willett Pot Still Reserve Bourbon",
  "Westward American Single Malt Vintage Muscat Cask",
  "Bundaberg O.P. Rum",
  "Bundaberg Overproof Rum",
  "Bundaberg Extra Smooth Red Rum",
  "Bundaberg Master Distillers Collection Blenders Edition 2014",
  "Inner Circle Rum 33 O.P. Full Strength",
  "Comte Joseph Fine Cognac VSOP",
  "Choya Organic Kokuto Umeshu",
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getVqd(query) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" } });
  const text = await res.text();
  const match = text.match(/vqd=['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

async function searchImages(query, vqd) {
  const url = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&f=,,,,,&p=1`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36", "Referer": "https://duckduckgo.com/" } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

async function downloadImage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("svg") || ct.includes("gif") || ct.includes("html")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) return null;
    return { buf, contentType: ct.split(";")[0].trim() || "image/jpeg" };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function fetchAndUploadImage(itemId, productName) {
  const query = `${productName} whisky bottle`;
  try {
    const vqd = await getVqd(query);
    if (!vqd) { console.log(`  No vqd for: ${productName}`); return null; }
    await sleep(500);
    const results = await searchImages(query, vqd);
    for (const r of results.slice(0, 8)) {
      if (!r.image) continue;
      if (r.image.match(/\.(svg|gif)($|\?)/i)) continue;
      const img = await downloadImage(r.image);
      if (!img) continue;
      const ext = img.contentType.includes("png") ? "png" : "jpg";
      const key = `products/${itemId}_original.${ext}`;
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: img.buf, ContentType: img.contentType }));
      return key;
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
  return null;
}

async function run() {
  const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });
  let done = 0, failed = 0;

  for (const name of NEW_BOTTLES) {
    const item = await db.collectionItem.findFirst({
      where: { userId: user.id, product: { name } },
      include: { images: true },
    });
    if (!item) { console.log(`⚠ Not found: ${name}`); continue; }
    if (item.images.length > 0) { console.log(`⏭  ${name}`); done++; continue; }

    process.stdout.write(`Fetching: ${name}... `);
    const key = await fetchAndUploadImage(item.id, name);
    if (key) {
      await db.itemImage.create({ data: { collectionItemId: item.id, storageKey: key, isPrimary: true } });
      console.log(`✓`);
      done++;
    } else {
      console.log(`✗`);
      failed++;
    }
    await sleep(800);
  }

  console.log(`\nImages: ${done} fetched, ${failed} failed`);
  await db.$disconnect();
}

run().catch(e => { console.error(e.message); db.$disconnect(); process.exit(1); });
