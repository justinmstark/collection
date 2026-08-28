import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

// Confirmed direct URLs from research
const CONFIRMED: Record<string, string> = {
  "140.14": "https://www.smws.ca/assets/ProductImages/140.14-web.png",
  "144.4":  "https://www.smws.ca/assets/ProductImages/144.4-hires.jpg",
  "19.74":  "https://caskcartel.com/cdn/shop/products/388428-big_fb6fd1f5-7628-44af-ae66-16ee32751a57.jpg?v=1696884378&width=1214",
  "55.90":  "https://www.smws.ca/assets/ProductImages/55.90-GX-web.png",
  "10.277": "https://www.smws.ca/assets/ProductImages/10.277-GX-web.png",
};

// SMWS Canada CDN patterns to try for the rest
function canadaUrls(code: string): string[] {
  return [
    `https://www.smws.ca/assets/ProductImages/${code}-GX-web.png`,
    `https://www.smws.ca/assets/ProductImages/${code}-web.png`,
    `https://www.smws.ca/assets/ProductImages/${code}-hires.jpg`,
    `https://www.smws.ca/assets/ProductImages/${code}.png`,
  ];
}

async function tryFetch(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("image")) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function uploadToMinio(buffer: Buffer, key: string, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
}

async function main() {
  const products = await db.product.findMany({
    where: { smwsCode: { not: null } },
    include: { items: { include: { images: true }, take: 1 } },
  });

  let saved = 0, skipped = 0, failed = 0;

  for (const product of products) {
    const code = product.smwsCode!;
    const item = product.items[0];
    if (!item) { skipped++; continue; }
    if (item.images.length > 0) {
      process.stdout.write(`  skip  ${code} — already has image\n`);
      skipped++;
      continue;
    }

    process.stdout.write(`  ${code}  … `);

    let buffer: Buffer | null = null;
    let ext = "png";
    let sourceUrl = "";

    // Try confirmed URL first
    if (CONFIRMED[code]) {
      buffer = await tryFetch(CONFIRMED[code]);
      if (buffer) {
        sourceUrl = CONFIRMED[code];
        ext = CONFIRMED[code].match(/\.(jpg|jpeg|png|webp)/i)?.[1] ?? "png";
      }
    }

    // Fall back to SMWS Canada CDN patterns
    if (!buffer) {
      for (const url of canadaUrls(code)) {
        buffer = await tryFetch(url);
        if (buffer) {
          sourceUrl = url;
          ext = url.match(/\.(jpg|jpeg|png|webp)/i)?.[1] ?? "png";
          break;
        }
      }
    }

    if (!buffer) {
      console.log("not found");
      failed++;
      continue;
    }

    const key = `smws/${code.replace(".", "-")}.${ext}`;
    const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
    await uploadToMinio(buffer, key, contentType);

    await db.itemImage.create({
      data: { collectionItemId: item.id, storageKey: key, isPrimary: true },
    });

    console.log(`✓  ${key}  (${sourceUrl.split("/")[2]})`);
    saved++;
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone: ${saved} saved, ${skipped} skipped, ${failed} not found`);
}

main().catch(console.error).finally(() => db.$disconnect());
