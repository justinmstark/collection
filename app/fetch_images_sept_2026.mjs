/**
 * Fetch images for all collection items that have no images yet.
 * Uses Google Custom Search API, downloads the image, and stores in MinIO.
 */
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const db = new PrismaClient();

const s3 = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT ?? "minio"}:${process.env.MINIO_PORT ?? "9000"}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET ?? "collection-images";
const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

async function googleImageSearch(query) {
  if (!GOOGLE_KEY || !GOOGLE_CX) { console.log("  ⚠ No Google API key"); return []; }
  const params = new URLSearchParams({ key: GOOGLE_KEY, cx: GOOGLE_CX, searchType: "image", q: query, num: "5" });
  try {
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log(`  ⚠ Google API error ${res.status}`); return []; }
    const data = await res.json();
    return (data.items ?? []).map(i => ({ url: i.link, title: i.title }));
  } catch (e) {
    console.log(`  ⚠ Google search failed: ${e.message}`);
    return [];
  }
}

async function downloadAndStore(url, userId, itemId) {
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CollectionBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!ALLOWED.includes(ct)) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5000) return null; // skip tiny/broken images
    const ext = ct === "image/png" ? "png" : ct === "image/webp" ? "webp" : "jpg";
    const key = `${userId}/${itemId}/${randomUUID()}.${ext}`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: ct }));
    return key;
  } catch {
    return null;
  }
}

const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });
if (!user) { console.error("User not found"); process.exit(1); }

// Get items with no images
const items = await db.collectionItem.findMany({
  where: { userId: user.id, images: { none: {} } },
  include: { product: { include: { producer: true } } },
  orderBy: { createdAt: "desc" },
});

console.log(`Found ${items.length} items without images\n`);

for (const item of items) {
  const name = item.product?.name ?? item.customName ?? "Unknown";
  const producer = item.product?.producer?.name ?? "";
  const category = item.product?.category ?? "spirits";

  // Build a search query tailored to category
  const categoryTerm = category === "wine" ? "wine bottle" : category === "spirits" ? "bottle" : "whisky bottle";
  const query = [name, producer, categoryTerm].filter(Boolean).join(" ");

  console.log(`→ ${name}`);
  console.log(`  search: "${query}"`);

  const results = await googleImageSearch(query);
  let stored = false;

  for (const result of results) {
    const key = await downloadAndStore(result.url, user.id, item.id);
    if (key) {
      await db.itemImage.create({ data: { collectionItemId: item.id, storageKey: key, isPrimary: true } });
      console.log(`  ✓ image saved`);
      stored = true;
      break;
    }
  }

  if (!stored) console.log(`  ✗ no usable image found`);
  await new Promise(r => setTimeout(r, 300)); // rate limit
}

console.log("\nDone!");
await db.$disconnect();
