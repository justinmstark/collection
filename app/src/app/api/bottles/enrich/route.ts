import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchProductImage, searchPrice } from "@/lib/enrich";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, producer } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const [imageUrl, price] = await Promise.all([
    searchProductImage(name, producer ?? ""),
    searchPrice(name, producer ?? ""),
  ]);

  return NextResponse.json({ imageUrl, price });
}
