import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadImage } from "@/lib/s3";
import { removeBackground } from "@/lib/bgremove";
import { randomUUID } from "crypto";

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const item = await db.collectionItem.findFirst({ where: { id, userId }, include: { images: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let imageRes: Response;
  try {
    imageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CollectionBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
  }

  if (!imageRes.ok) {
    return NextResponse.json({ error: "Remote image not accessible" }, { status: 400 });
  }

  const contentType = imageRes.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: `Not an image (got ${contentType})` }, { status: 400 });
  }

  let buffer: Buffer = Buffer.from(await imageRes.arrayBuffer() as ArrayBuffer);
  let finalContentType = contentType;
  try {
    buffer = await removeBackground(buffer);
    finalContentType = "image/png";
  } catch { /* keep original if bg removal fails */ }
  const ext = finalContentType === "image/png" ? "png" : (EXT[contentType] ?? "jpg");
  const key = `${userId}/${id}/${randomUUID()}.${ext}`;
  await uploadImage(key, buffer, finalContentType);

  const isPrimary = item.images.length === 0;
  const image = await db.itemImage.create({
    data: { collectionItemId: id, storageKey: key, isPrimary },
  });

  return NextResponse.json(image, { status: 201 });
}
