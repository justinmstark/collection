import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const p = await db.product.findFirst({ where: { smwsCode: "35.331" } });
  if (!p) { console.error("not found"); return; }
  await db.product.update({ where: { id: p.id }, data: { name: "Ultra Hoggie", caskType: "Oak hogshead" } });
  console.log("✓ 35.331 renamed to Ultra Hoggie");
}
main().catch(console.error).finally(() => db.$disconnect());
