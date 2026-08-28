import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  for (const [oldKey, newKey] of [
    ["smws/144-4.jpg", "smws/144-4.png"],
    ["smws/19-74.jpg", "smws/19-74.png"],
  ] as const) {
    const r = await db.itemImage.updateMany({ where: { storageKey: oldKey }, data: { storageKey: newKey } });
    console.log(`${oldKey} → ${newKey}: ${r.count} updated`);
  }
}
main().catch(console.error).finally(() => db.$disconnect());
