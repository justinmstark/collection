import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadImage } from "@/lib/s3";
import { randomUUID } from "crypto";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const item = await db.collectionItem.findFirst({ where: { id, userId }, include: { images: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `${userId}/${id}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadImage(key, buffer, file.type);

  const isPrimary = item.images.length === 0;
  const image = await db.itemImage.create({
    data: { collectionItemId: id, storageKey: key, isPrimary },
  });

  return NextResponse.json(image, { status: 201 });
}
