import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const product = await db.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.product.update({
    where: { id },
    data: {
      description: body.description !== undefined ? body.description : undefined,
      drinkFrom: body.drinkFrom !== undefined ? (body.drinkFrom ? parseInt(body.drinkFrom) : null) : undefined,
      drinkUntil: body.drinkUntil !== undefined ? (body.drinkUntil ? parseInt(body.drinkUntil) : null) : undefined,
      vintage: body.vintage !== undefined ? (body.vintage ? parseInt(body.vintage) : null) : undefined,
    },
  });

  return NextResponse.json(updated);
}
