import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const updates = [
    { smwsCode: "17.28", age: 8,  abv: 56.7, caskType: "2nd fill ex-bourbon hogshead" },
    { smwsCode: "53.526", age: 15, abv: 57.2, caskType: "Bourbon/1st fill American oak PX" },
  ];
  for (const u of updates) {
    const p = await db.product.findFirst({ where: { smwsCode: u.smwsCode } });
    if (!p) { console.error(`Not found: ${u.smwsCode}`); continue; }
    await db.product.update({ where: { id: p.id }, data: { age: u.age, abv: u.abv, caskType: u.caskType } });
    console.log(`✓ ${u.smwsCode}  ${u.age}yr  ${u.abv}%  ${u.caskType}`);
  }
}
main().catch(console.error).finally(() => db.$disconnect());
