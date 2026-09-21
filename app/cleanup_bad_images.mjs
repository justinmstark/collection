import { PrismaClient } from "@prisma/client";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const db = new PrismaClient();
const s3 = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT ?? "minio"}:${process.env.MINIO_PORT ?? "9000"}`,
  region: "us-east-1",
  credentials: { accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin", secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin" },
  forcePathStyle: true,
});
const BUCKET = process.env.MINIO_BUCKET ?? "collection-images";

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
let removed = 0;
for (const name of BOTTLE_NAMES) {
  const product = await db.product.findFirst({ where: { name } });
  if (!product) continue;
  const item = await db.collectionItem.findFirst({ where: { userId: user.id, productId: product.id }, include: { images: true } });
  if (!item || item.images.length === 0) continue;
  for (const img of item.images) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: img.storageKey })).catch(() => {});
    await db.itemImage.delete({ where: { id: img.id } });
    removed++;
  }
  console.log(`✓ cleared ${name}`);
}
console.log(`\nRemoved ${removed} bad images.`);
await db.$disconnect();
