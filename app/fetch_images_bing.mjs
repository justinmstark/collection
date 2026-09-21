/**
 * Fetch images for newly seeded bottles using Bing image search.
 * First removes any existing group-shot photos, then fetches proper product images.
 */
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

async function bingImageSearch(query) {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(`https://www.bing.com/images/search?q=${q}&first=1`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const matches = [...html.matchAll(/mediaurl=(https?[^&"]+)/g)];
    return matches.slice(0, 8).map(m => decodeURIComponent(m[1]));
  } catch {
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
    if (buffer.length < 8000) return null; // skip tiny/broken images
    const ext = ct === "image/png" ? "png" : ct === "image/webp" ? "webp" : "jpg";
    const key = `${userId}/${itemId}/${randomUUID()}.${ext}`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: ct }));
    return key;
  } catch {
    return null;
  }
}

// The bottles we seeded — all from the Sept 2026 batch
const BOTTLE_NAMES = [
  "The Maverick Barossa Shiraz Cabernet Sauvignon 2022",
  "Twin Valleys Single Site Reserve King Valley Chardonnay 2023",
  "Pirathon Silver Label Shiraz 2018",
  "Champagne Moulin Jean Philippe Brut",
  "Moët & Chandon 2006 Grand Vintage Champagne",
  "Moët Impérial Brut Champagne",
  "Penfolds Bin 8 Shiraz Cabernet 2020",
  "Cat Amongst The Pigeons Fat Cat Barossa Shiraz 2024",
  "Mérite Single Vineyard Malbec Wrattonbully",
  "R. Paulazzo Single Vineyard Cabernet Sauvignon Hilltops 2023",
  "Arras Tasmania Brut Rosé",
  "Sorby Adams Handcrafted South Australia Chardonnay 2023",
  "Marlborough Sounds Pinot Gris 2025",
  "Woodside Park Adelaide Hills Pinot Grigio 2025",
  "Montvalley Reserve Semillon 2025",
  "Small and Small Penelope Reserve Marlborough Pinot Noir",
  "Hardy's Rare Muscat Barrel Selected A06",
  "McWilliam's Hanwood Estate 10 Year Old Grand Tawny",
  "Orlando Liqueur Port Average Age 10 Years",
  "Sorby Adams Barossa Cabernet Sauvignon 2022",
  "De Bortoli Noble One 10",
  "Pommery Platinum One Champagne",
  "Old Boys 21 Year Old Barrel Aged Tawny",
  "Rémy Martin VSOP Fine Champagne Cognac",
  "Fire & Ice Vodka Gold Switzerland",
  "Kahlúa The Original Coffee Liqueur",
  "Hennessy VSOP Cognac",
  "Japanese Apricot Sake (Anzu no Osake)",
  "Japanese Pineapple Sake (Arani Juicy)",
];

const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });
if (!user) { console.error("User not found"); process.exit(1); }

for (const bottleName of BOTTLE_NAMES) {
  const product = await db.product.findFirst({ where: { name: bottleName } });
  if (!product) { console.log(`⚠ Product not found: ${bottleName}`); continue; }

  const item = await db.collectionItem.findFirst({
    where: { userId: user.id, productId: product.id },
    include: { images: true },
  });
  if (!item) { console.log(`⚠ Item not found: ${bottleName}`); continue; }

  // Remove existing group-shot images
  for (const img of item.images) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: img.storageKey })).catch(() => {});
    await db.itemImage.delete({ where: { id: img.id } });
  }

  const category = product.category;
  const producer = product.producerId
    ? (await db.producer.findUnique({ where: { id: product.producerId } }))?.name ?? ""
    : "";
  const categoryTerm = category === "wine" ? "wine bottle" : "bottle";
  const query = [bottleName, producer, categoryTerm].filter(Boolean).join(" ");

  console.log(`→ ${bottleName}`);
  const urls = await bingImageSearch(query);

  let stored = false;
  for (const url of urls) {
    const key = await downloadAndStore(url, user.id, item.id);
    if (key) {
      await db.itemImage.create({ data: { collectionItemId: item.id, storageKey: key, isPrimary: true } });
      console.log(`  ✓ ${new URL(url).hostname}`);
      stored = true;
      break;
    }
  }

  if (!stored) console.log(`  ✗ no usable image found`);
  await new Promise(r => setTimeout(r, 500));
}

console.log("\nDone!");
await db.$disconnect();
