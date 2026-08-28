import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const items = await db.collectionItem.findMany({
    where: {
      userId,
      ...(category ? { product: { category } } : {}),
    },
    include: {
      product: { include: { producer: { include: { region: true } } } },
      images: { where: { isPrimary: true }, take: 1 },
      valuations: { orderBy: { valuedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const price = body.purchasePrice ? parseFloat(body.purchasePrice) : null;

  const item = await db.collectionItem.create({
    data: {
      userId,
      productId: body.productId ?? null,
      customName: body.customName ?? null,
      quantity: body.quantity ?? 1,
      purchasePrice: price,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      status: body.status ?? "sealed",
      notes: body.notes ?? null,
    },
    include: { product: true },
  });

  if (price && price > 0) {
    await db.valuation.create({
      data: {
        collectionItemId: item.id,
        value: price,
        source: body.valuationSource ?? "Estimated at time of adding",
        valuedAt: new Date(),
      },
    });
  }

  return NextResponse.json(item, { status: 201 });
}
