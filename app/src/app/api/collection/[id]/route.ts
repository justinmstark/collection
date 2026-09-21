import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/s3";

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const item = await db.collectionItem.findFirst({
    where: { id, userId },
    include: {
      product: { include: { producer: { include: { region: true } } } },
      images: { orderBy: { isPrimary: "desc" } },
      valuations: { orderBy: { valuedAt: "desc" }, take: 1 },
    },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const existing = await db.collectionItem.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.collectionItem.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      notes: body.notes ?? undefined,
      quantity: body.quantity !== undefined ? parseInt(body.quantity) : undefined,
      purchasePrice: body.purchasePrice !== undefined ? parseFloat(body.purchasePrice) : undefined,
      customName: body.customName ?? undefined,
    },
    include: { product: true, images: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const item = await db.collectionItem.findFirst({
    where: { id, userId },
    include: { images: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const img of item.images) {
    await deleteImage(img.storageKey).catch(() => {});
  }

  await db.collectionItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
