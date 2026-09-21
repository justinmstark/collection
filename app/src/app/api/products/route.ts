import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  let producerId: string | null = null;
  if (body.producer) {
    let regionId: string | null = null;
    if (body.region && body.country) {
      const region = await db.region.upsert({
        where: { name: body.region },
        update: {},
        create: { name: body.region, country: body.country },
      });
      regionId = region.id;
    }
    const producer = await db.producer.upsert({
      where: { id: "placeholder" },
      update: {},
      create: { name: body.producer, regionId },
    }).catch(async () => {
      const existing = await db.producer.findFirst({ where: { name: body.producer } });
      if (existing) return existing;
      return db.producer.create({ data: { name: body.producer, regionId } });
    });
    producerId = producer.id;
  }

  const product = await db.product.create({
    data: {
      name: body.name,
      producerId,
      category: body.category ?? "whisky",
      subcategory: body.subcategory ?? null,
      age: body.age ? parseInt(body.age) : null,
      abv: body.abv ? parseFloat(body.abv) : null,
      caskType: body.caskType ?? null,
      description: body.description ?? null,
      smwsCode: body.smwsCode ?? null,
      vintage: body.vintage ? parseInt(body.vintage) : null,
      drinkFrom: body.drinkFrom ? parseInt(body.drinkFrom) : null,
      drinkUntil: body.drinkUntil ? parseInt(body.drinkUntil) : null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
