/**
 * Attach the user's bottle photos to the newly seeded collection items.
 * Each photo maps to one or more bottles. We upload the photo to MinIO
 * and link it as the primary image for each matching bottle.
 */
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";
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

const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });
if (!user) { console.error("User not found"); process.exit(1); }

// photo file → array of bottle names it contains
const PHOTO_MAP = [
  { file: "bottle_photos/20260920_095025.jpg", bottles: [
    "The Maverick Barossa Shiraz Cabernet Sauvignon 2022",
    "Pirathon Silver Label Shiraz 2018",
    "Champagne Moulin Jean Philippe Brut",
  ]},
  { file: "bottle_photos/20260920_094751.jpg", bottles: [
    "Twin Valleys Single Site Reserve King Valley Chardonnay 2023",
  ]},
  { file: "bottle_photos/20260920_094827.jpg", bottles: [
    // duplicate angle of Twin Valleys — skip, already assigned above
  ]},
  { file: "bottle_photos/20260920_094905.jpg", bottles: [
    // duplicate angle of The Maverick — skip, already assigned above
  ]},
  { file: "bottle_photos/20260920_095426.jpg", bottles: [
    "Rémy Martin VSOP Fine Champagne Cognac",
    "Moët & Chandon 2006 Grand Vintage Champagne",
    "Moët Impérial Brut Champagne",
  ]},
  { file: "bottle_photos/20260920_095126.jpg", bottles: [
    "Penfolds Bin 8 Shiraz Cabernet 2020",
    "Cat Amongst The Pigeons Fat Cat Barossa Shiraz 2024",
    "Mérite Single Vineyard Malbec Wrattonbully",
    "R. Paulazzo Single Vineyard Cabernet Sauvignon Hilltops 2023",
  ]},
  { file: "bottle_photos/20260920_095358.jpg", bottles: [
    "Fire & Ice Vodka Gold Switzerland",
    "Arras Tasmania Brut Rosé",
  ]},
  { file: "bottle_photos/20260920_095513.jpg", bottles: [
    "Japanese Apricot Sake (Anzu no Osake)",
    "Japanese Pineapple Sake (Arani Juicy)",
  ]},
  { file: "bottle_photos/20260920_094715.jpg", bottles: [
    "Sorby Adams Handcrafted South Australia Chardonnay 2023",
    "Marlborough Sounds Pinot Gris 2025",
    "Woodside Park Adelaide Hills Pinot Grigio 2025",
    "Montvalley Reserve Semillon 2025",
  ]},
  { file: "bottle_photos/20260920_095215.jpg", bottles: [
    "Hennessy VSOP Cognac",
    "Small and Small Penelope Reserve Marlborough Pinot Noir",
    "Hardy's Rare Muscat Barrel Selected A06",
  ]},
  { file: "bottle_photos/20260920_095309.jpg", bottles: [
    "De Bortoli Noble One 10",
    "Kahlúa The Original Coffee Liqueur",
    "Pommery Platinum One Champagne",
    "Old Boys 21 Year Old Barrel Aged Tawny",
  ]},
  { file: "bottle_photos/20260920_094948.jpg", bottles: [
    "McWilliam's Hanwood Estate 10 Year Old Grand Tawny",
    "Orlando Liqueur Port Average Age 10 Years",
    "Sorby Adams Barossa Cabernet Sauvignon 2022",
  ]},
];

for (const { file, bottles } of PHOTO_MAP) {
  if (bottles.length === 0) continue;

  let buffer;
  try {
    buffer = await readFile(`/app/${file}`);
  } catch {
    console.log(`⚠ File not found: ${file}`);
    continue;
  }

  for (const bottleName of bottles) {
    const product = await db.product.findFirst({ where: { name: bottleName } });
    if (!product) { console.log(`⚠ Product not found: ${bottleName}`); continue; }

    const item = await db.collectionItem.findFirst({
      where: { userId: user.id, productId: product.id },
      include: { images: true },
    });
    if (!item) { console.log(`⚠ Item not found: ${bottleName}`); continue; }
    if (item.images.length > 0) { console.log(`⏭  ${bottleName} (already has image)`); continue; }

    const key = `${user.id}/${item.id}/${randomUUID()}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: "image/jpeg" }));
    await db.itemImage.create({ data: { collectionItemId: item.id, storageKey: key, isPrimary: true } });
    console.log(`✓ ${bottleName}`);
  }
}

console.log("\nDone!");
await db.$disconnect();
