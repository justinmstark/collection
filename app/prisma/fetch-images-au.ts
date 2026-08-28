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

function toAuSlug(code: string, name: string): string {
  const codeSlug = code.replace(".", "-");
  const nameSlug = name
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[éèêë]/g, "e")
    .replace(/[àâä]/g, "a")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${codeSlug}-${nameSlug}`;
}

async function fetchImageUrl(slug: string): Promise<string | null> {
  const url = `https://smws.com.au/product/${slug}/`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-AU,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/property="og:image"\s+content="([^"]+)"/) ??
                  html.match(/"og:image",\s*"([^"]+)"/) ??
                  html.match(/wp-content\/uploads\/[^"']+\.(png|jpg|webp)/);
    if (match) return match[0].startsWith("http") ? match[0] : `https://smws.com.au/${match[0]}`;
    return null;
  } catch {
    return null;
  }
}

async function downloadAndStore(imageUrl: string, key: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = key.split(".").pop() ?? "png";
    const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Only products that still have no image
  const products = await db.product.findMany({
    where: { smwsCode: { not: null } },
    include: { items: { include: { images: true }, take: 1 } },
  });

  const missing = products.filter((p) => p.items[0] && p.items[0].images.length === 0);
  console.log(`${missing.length} bottles still need images\n`);

  let saved = 0, failed = 0;

  for (const product of missing) {
    const code = product.smwsCode!;
    const slug = toAuSlug(code, product.name);
    process.stdout.write(`  ${code}  ${slug}  … `);

    const imageUrl = await fetchImageUrl(slug);
    if (!imageUrl) {
      console.log("not found");
      failed++;
      continue;
    }

    const ext = imageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] ?? "jpg";
    const key = `smws/${code.replace(".", "-")}.${ext}`;
    const ok = await downloadAndStore(imageUrl, key);

    if (!ok) {
      console.log(`found but download failed: ${imageUrl}`);
      failed++;
      continue;
    }

    await db.itemImage.create({
      data: { collectionItemId: product.items[0].id, storageKey: key, isPrimary: true },
    });

    console.log(`✓`);
    saved++;
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\nDone: ${saved} saved, ${failed} not found/failed`);
}

main().catch(console.error).finally(() => db.$disconnect());
