import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });
if (!user) { console.error("User not found"); process.exit(1); }

async function upsertRegion(name, country) {
  return db.region.upsert({ where: { name }, update: {}, create: { name, country } });
}
async function upsertProducer(name, regionId) {
  const existing = await db.producer.findFirst({ where: { name } });
  if (existing) return existing;
  return db.producer.create({ data: { name, regionId } });
}

async function addBottle({ name, producerName, regionName, country, category, subcategory, age, abv, caskType, smwsCode, description, vintage, drinkFrom, drinkUntil, quantity, value, valueSource }) {
  const region = regionName ? await upsertRegion(regionName, country) : null;
  const producer = producerName ? await upsertProducer(producerName, region?.id ?? null) : null;

  const existing = await db.product.findFirst({ where: { name } });
  let product = existing;
  if (!product) {
    product = await db.product.create({
      data: {
        name,
        producerId: producer?.id ?? null,
        category,
        subcategory: subcategory ?? null,
        age: age ?? null,
        abv: abv ?? null,
        caskType: caskType ?? null,
        smwsCode: smwsCode ?? null,
        description: description ?? null,
        vintage: vintage ?? null,
        drinkFrom: drinkFrom ?? null,
        drinkUntil: drinkUntil ?? null,
      },
    });
  }

  const existingItem = await db.collectionItem.findFirst({ where: { userId: user.id, productId: product.id } });
  if (existingItem) {
    // Update quantity if adding more
    if (quantity && quantity > existingItem.quantity) {
      await db.collectionItem.update({ where: { id: existingItem.id }, data: { quantity } });
      console.log(`↑ ${name} (qty updated to ${quantity})`);
    } else {
      console.log(`⏭  ${name} (already in collection)`);
    }
    return existingItem;
  }

  const item = await db.collectionItem.create({
    data: { userId: user.id, productId: product.id, quantity: quantity ?? 1, status: "sealed" },
  });
  if (value) {
    await db.valuation.create({
      data: { collectionItemId: item.id, value, source: valueSource ?? "Market price estimate (AUD)", valuedAt: new Date() },
    });
  }
  console.log(`✓ ${name} (qty: ${quantity ?? 1})`);
  return item;
}

const bottles = [
  // ── Wines ─────────────────────────────────────────────────────────────────
  {
    name: "The Maverick Barossa Shiraz Cabernet Sauvignon 2022",
    producerName: "The Maverick", regionName: "Barossa", country: "Australia",
    category: "wine", subcategory: "shiraz cabernet sauvignon",
    vintage: 2022, drinkFrom: 2024, drinkUntil: 2030,
    abv: null, description: "Barossa Shiraz Cabernet Sauvignon. Vintage 2022.",
    quantity: 6, value: 35, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Twin Valleys Single Site Reserve King Valley Chardonnay 2023",
    producerName: "Twin Valleys", regionName: "King Valley", country: "Australia",
    category: "wine", subcategory: "chardonnay",
    vintage: 2023, drinkFrom: 2024, drinkUntil: 2028,
    abv: null, description: "Single Site Reserve Chardonnay. King Valley, Victoria.",
    quantity: 8, value: 40, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Pirathon Silver Label Shiraz 2018",
    producerName: "Pirathon", regionName: "Barossa Valley", country: "Australia",
    category: "wine", subcategory: "shiraz",
    vintage: 2018, drinkFrom: 2022, drinkUntil: 2032,
    abv: null, description: "Barossa Valley Shiraz. Silver Label. 2018.",
    quantity: 1, value: 60, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Champagne Moulin Jean Philippe Brut",
    producerName: "Jean Philippe Moulin", regionName: "Champagne", country: "France",
    category: "wine", subcategory: "champagne",
    drinkFrom: 2024, drinkUntil: 2028,
    abv: 12.5, description: "Brut Champagne. Élaboré par Jean Philippe Moulin.",
    quantity: 1, value: 55, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Moët & Chandon 2006 Grand Vintage Champagne",
    producerName: "Moët & Chandon", regionName: "Champagne", country: "France",
    category: "wine", subcategory: "champagne",
    vintage: 2006, drinkFrom: 2012, drinkUntil: 2030,
    abv: 12.5, description: "Grand Vintage 2006. Prestige cuvée.",
    quantity: 1, value: 180, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Moët Impérial Brut Champagne",
    producerName: "Moët & Chandon", regionName: "Champagne", country: "France",
    category: "wine", subcategory: "champagne",
    drinkFrom: 2024, drinkUntil: 2027,
    abv: 12, description: "Moët Impérial Brut. Non-vintage.",
    quantity: 1, value: 70, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Penfolds Bin 8 Shiraz Cabernet 2020",
    producerName: "Penfolds", regionName: "South Australia", country: "Australia",
    category: "wine", subcategory: "shiraz cabernet",
    vintage: 2020, drinkFrom: 2023, drinkUntil: 2030,
    abv: null, description: "Bin 8 Shiraz Cabernet. 2020.",
    quantity: 1, value: 40, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Cat Amongst The Pigeons Fat Cat Barossa Shiraz 2024",
    producerName: "Cat Amongst The Pigeons", regionName: "Barossa", country: "Australia",
    category: "wine", subcategory: "shiraz",
    vintage: 2024, drinkFrom: 2025, drinkUntil: 2030,
    abv: null, description: "Fat Cat Barossa Shiraz. Vintage 2024.",
    quantity: 1, value: 35, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Mérite Single Vineyard Malbec Wrattonbully",
    producerName: "Mérite", regionName: "Wrattonbully", country: "Australia",
    category: "wine", subcategory: "malbec",
    drinkFrom: 2024, drinkUntil: 2030,
    abv: null, description: "Single Vineyard Malbec. Wrattonbully, South Australia.",
    quantity: 1, value: 45, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "R. Paulazzo Single Vineyard Cabernet Sauvignon Hilltops 2023",
    producerName: "R. Paulazzo", regionName: "Hilltops", country: "Australia",
    category: "wine", subcategory: "cabernet sauvignon",
    vintage: 2023, drinkFrom: 2026, drinkUntil: 2033,
    abv: null, description: "Limited Release. Single Vineyard Cabernet Sauvignon. Hilltops. 2023.",
    quantity: 1, value: 45, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Arras Tasmania Brut Rosé",
    producerName: "House of Arras", regionName: "Tasmania", country: "Australia",
    category: "wine", subcategory: "sparkling rosé",
    drinkFrom: 2024, drinkUntil: 2028,
    abv: null, description: "Brut Rosé. Méthode Traditionnelle. Tasmania.",
    quantity: 1, value: 90, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Sorby Adams Handcrafted South Australia Chardonnay 2023",
    producerName: "Sorby Adams", regionName: "South Australia", country: "Australia",
    category: "wine", subcategory: "chardonnay",
    vintage: 2023, drinkFrom: 2024, drinkUntil: 2027,
    abv: null, description: "Handcrafted South Australia Chardonnay 2023. Family Owned Vignerons.",
    quantity: 1, value: 30, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Marlborough Sounds Pinot Gris 2025",
    producerName: "Marlborough Sounds", regionName: "Marlborough", country: "New Zealand",
    category: "wine", subcategory: "pinot gris",
    vintage: 2025, drinkFrom: 2025, drinkUntil: 2028,
    abv: null, description: "Pinot Gris. Marlborough, New Zealand. 2025.",
    quantity: 1, value: 25, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Woodside Park Adelaide Hills Pinot Grigio 2025",
    producerName: "Woodside Park", regionName: "Adelaide Hills", country: "Australia",
    category: "wine", subcategory: "pinot grigio",
    vintage: 2025, drinkFrom: 2025, drinkUntil: 2027,
    abv: null, description: "100% Estate Grown. Adelaide Hills Pinot Grigio 2025.",
    quantity: 1, value: 28, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Montvalley Reserve Semillon 2025",
    producerName: "Montvalley", regionName: "Hunter Valley", country: "Australia",
    category: "wine", subcategory: "semillon",
    vintage: 2025, drinkFrom: 2025, drinkUntil: 2035,
    abv: null, description: "Reserve Semillon. Hunter Valley. Est 1908.",
    quantity: 1, value: 30, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Small and Small Penelope Reserve Marlborough Pinot Noir",
    producerName: "Small and Small", regionName: "Marlborough", country: "New Zealand",
    category: "wine", subcategory: "pinot noir",
    drinkFrom: 2024, drinkUntil: 2029,
    abv: null, description: "Penelope Reserve Marlborough Pinot Noir. New Zealand.",
    quantity: 1, value: 45, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Hardy's Rare Muscat Barrel Selected A06",
    producerName: "Hardy's", regionName: "South Australia", country: "Australia",
    category: "wine", subcategory: "muscat",
    drinkFrom: 2024, drinkUntil: 2040,
    abv: null, description: "Rare Muscat. Barrel Selected. Blend A06. From 500 barrels. 500ml.",
    quantity: 2, value: 50, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "McWilliam's Hanwood Estate 10 Year Old Grand Tawny",
    producerName: "McWilliam's", regionName: "New South Wales", country: "Australia",
    category: "wine", subcategory: "tawny port",
    drinkFrom: 2024, drinkUntil: 2040,
    abv: null, description: "Hanwood Estate Grand Tawny. A blend of finest oak aged wines averaging more than ten years.",
    quantity: 1, value: 25, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Orlando Liqueur Port Average Age 10 Years",
    producerName: "Orlando", regionName: "Barossa Valley", country: "Australia",
    category: "wine", subcategory: "liqueur port",
    drinkFrom: 2024, drinkUntil: 2040,
    abv: 18, description: "Premium Quality Liqueur Port. Average Age Ten Years. Barossa Valley.",
    quantity: 2, value: 20, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Sorby Adams Barossa Cabernet Sauvignon 2022",
    producerName: "Sorby Adams", regionName: "Barossa", country: "Australia",
    category: "wine", subcategory: "cabernet sauvignon",
    vintage: 2022, drinkFrom: 2025, drinkUntil: 2032,
    abv: null, description: "Barossa Cabernet Sauvignon 2022.",
    quantity: 1, value: 40, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "De Bortoli Noble One 10",
    producerName: "De Bortoli", regionName: "Riverina", country: "Australia",
    category: "wine", subcategory: "botrytis semillon",
    drinkFrom: 2024, drinkUntil: 2035,
    abv: null, description: "Noble One 10. Botrytis Semillon. Dessert wine.",
    quantity: 1, value: 45, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Pommery Platinum One Champagne",
    producerName: "Pommery", regionName: "Champagne", country: "France",
    category: "wine", subcategory: "champagne",
    drinkFrom: 2024, drinkUntil: 2030,
    abv: 12.5, description: "Platinum One. Hommage à Madame Pommery. 150th Anniversary. Méthode Champenoise 1874.",
    quantity: 1, value: 200, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Old Boys 21 Year Old Barrel Aged Tawny",
    producerName: "Old Boys", regionName: "South Australia", country: "Australia",
    category: "wine", subcategory: "tawny port",
    drinkFrom: 2024, drinkUntil: 2040,
    abv: null, description: "21 Year Old. Show Reserve Barrel Aged Tawny.",
    quantity: 1, value: 60, valueSource: "Retail estimate (AUD)",
  },

  // ── Spirits ───────────────────────────────────────────────────────────────
  {
    name: "Rémy Martin VSOP Fine Champagne Cognac",
    producerName: "Rémy Martin", regionName: "Cognac", country: "France",
    category: "spirits", subcategory: "cognac",
    abv: 40, description: "Fine Champagne Cognac VSOP. Premier Cru. 700ml.",
    quantity: 2, value: 80, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Fire & Ice Vodka Gold Switzerland",
    producerName: "Fire & Ice", regionName: "Switzerland", country: "Switzerland",
    category: "spirits", subcategory: "vodka",
    abv: 40, description: "Vodka Gold. Bottled in Switzerland from Alpine water. 700ml.",
    quantity: 1, value: 55, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Kahlúa The Original Coffee Liqueur",
    producerName: "Kahlúa", regionName: "Veracruz", country: "Mexico",
    category: "spirits", subcategory: "liqueur",
    abv: 20, description: "The Original Coffee Liqueur. Made with real coffee beans. Veracruz Mexico.",
    quantity: 2, value: 40, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Hennessy VSOP Cognac",
    producerName: "Hennessy", regionName: "Cognac", country: "France",
    category: "spirits", subcategory: "cognac",
    abv: 40, description: "VSOP Cognac. Très Spécial.",
    quantity: 1, value: 90, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Japanese Apricot Sake (Anzu no Osake)",
    producerName: "Unknown", regionName: "Japan", country: "Japan",
    category: "spirits", subcategory: "sake / fruit liqueur",
    abv: null, description: "Japanese apricot sake. そのまんま、あんずのお酒. 500ml.",
    quantity: 1, value: 20, valueSource: "Retail estimate (AUD)",
  },
  {
    name: "Japanese Pineapple Sake (Arani Juicy)",
    producerName: "Unknown", regionName: "Japan", country: "Japan",
    category: "spirits", subcategory: "sake / fruit liqueur",
    abv: null, description: "Japanese pineapple sake. あらにじゅーしー Original. 500ml.",
    quantity: 1, value: 20, valueSource: "Retail estimate (AUD)",
  },
];

for (const bottle of bottles) {
  await addBottle(bottle);
}

console.log("\nDone!");
await db.$disconnect();
