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

async function addBottle({ name, producerName, regionName, country, category, subcategory, age, abv, caskType, description, smwsCode, value, valueSource }) {
  const region = await upsertRegion(regionName, country);
  const producer = await upsertProducer(producerName, region.id);
  const existing = await db.product.findFirst({ where: { name } });
  let product = existing;
  if (!product) {
    product = await db.product.create({
      data: { name, producerId: producer.id, category, subcategory, age, abv, caskType, description, smwsCode },
    });
  }
  const item = await db.collectionItem.create({
    data: { userId: user.id, productId: product.id, quantity: 1, status: "sealed" },
  });
  if (value) {
    await db.valuation.create({
      data: { collectionItemId: item.id, value, source: valueSource ?? "Market price estimate (AUD)", valuedAt: new Date() },
    });
  }
  console.log(`✓ ${name}`);
}

const bottles = [
  {
    name: "Morris Rutherglen Double Port Barrel Australian Single Malt",
    producerName: "Morris Whisky", regionName: "Rutherglen", country: "Australia",
    category: "whisky", subcategory: "Australian single malt",
    abv: 46, caskType: "Double Port Barrel",
    description: "Deep, dark and delectable. A fortified barrel masterpiece of vibrant forest fruits and malted chocolate. Whisky Club exclusive.",
    value: 130, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Highland Park 16 Year Old",
    producerName: "Highland Park", regionName: "Orkney Islands", country: "Scotland",
    category: "whisky", subcategory: "Single malt Scotch",
    age: 16, abv: 40, caskType: "Ex-bourbon",
    description: "Distilled in Kirkwall. 1 litre. Gently smoky with honeyed sweetness and aromatic dried fruit.",
    value: 145, valueSource: "Australian retail estimate",
  },
  {
    name: "Old Kempton Classic Range Sherry Cask",
    producerName: "Old Kempton Distillery", regionName: "Tasmania", country: "Australia",
    category: "whisky", subcategory: "Australian single malt",
    abv: 64, caskType: "Sherry",
    description: "Hand crafted, double distilled. Classic Range. 500mL cask strength single malt from Tasmania. Cask No. SMD 716.",
    value: 280, valueSource: "Old Kempton Distillery estimate (oldkempton.com.au)",
  },
  {
    name: "Fuji Single Malt Japanese Whisky",
    producerName: "Fuji Gotemba Distillery", regionName: "Shizuoka", country: "Japan",
    category: "whisky", subcategory: "Japanese single malt",
    abv: 46,
    description: "The gift from Mt. Fuji. Product of Japan / Kirin. 700mL. Whisky Club exclusive release.",
    value: 160, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Yamazaki Single Malt Distiller's Reserve",
    producerName: "Suntory", regionName: "Osaka", country: "Japan",
    category: "whisky", subcategory: "Japanese single malt",
    abv: 43,
    description: "The oldest distillery in Japan. From the house of Suntory Whisky. 700mL.",
    value: 185, valueSource: "Australian retail estimate",
  },
  {
    name: "Hakushu Distiller's Reserve",
    producerName: "Suntory", regionName: "Yamanashi", country: "Japan",
    category: "whisky", subcategory: "Japanese single malt",
    abv: 43,
    description: "Distilled at Hakushu distillery surrounded by forest at the foot of the Southern Japan Alps. Suntory Whisky.",
    value: 185, valueSource: "Australian retail estimate",
  },
  {
    name: "Nikka Taketsuru Pure Malt",
    producerName: "Nikka Whisky", regionName: "Hokkaido", country: "Japan",
    category: "whisky", subcategory: "Japanese blended malt",
    abv: 43,
    description: "NAS. Blended malt honouring Masataka Taketsuru, father of Japanese whisky.",
    value: 95, valueSource: "Australian retail estimate",
  },
  {
    name: "The Chita",
    producerName: "Suntory", regionName: "Aichi", country: "Japan",
    category: "whisky", subcategory: "Japanese grain whisky",
    abv: 43,
    description: "Chita Distillery grain whisky. Light-bodied yet complex. 70cl.",
    value: 115, valueSource: "Australian retail estimate",
  },
  {
    name: "Old Kempton Chardonnay Cask Special Release",
    producerName: "Old Kempton Distillery", regionName: "Tasmania", country: "Australia",
    category: "whisky", subcategory: "Australian single malt",
    abv: 46, caskType: "Chardonnay Cask",
    description: "Whisky Club 24. Hand crafted, double distilled, special release. 500mL.",
    value: 135, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Old Kempton Palo Cortado Special Release",
    producerName: "Old Kempton Distillery", regionName: "Tasmania", country: "Australia",
    category: "whisky", subcategory: "Australian single malt",
    abv: 53.2, caskType: "Palo Cortado",
    description: "Whisky Club 25. Hand crafted, double distilled, special release. 500mL.",
    value: 145, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Old Kempton Stout Cask Special Release",
    producerName: "Old Kempton Distillery", regionName: "Tasmania", country: "Australia",
    category: "whisky", subcategory: "Australian single malt",
    abv: 56.4, caskType: "Stout Cask",
    description: "Whisky Club 26. Hand crafted, double distilled, special release. 500mL.",
    value: 145, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "The Whisky Club Blended Scotch 20 Year Old",
    producerName: "The Whisky Club", regionName: "Highlands & Islands", country: "Scotland",
    category: "whisky", subcategory: "Blended Scotch",
    age: 20, abv: 44.4, caskType: "Sherry Butts & Hogsheads",
    description: "Whisky Club exclusive. Components: Highlands, Islands & Lowlands. Non chill-filtered, natural colour. Casks MG24-MG82. Bottled April 2026. 700mL.",
    value: 175, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Ballantine's Finest",
    producerName: "Ballantine's", regionName: "Lowlands", country: "Scotland",
    category: "whisky", subcategory: "Blended Scotch",
    abv: 43,
    description: "Blended Scotch Whisky. 1 litre. Fully matured.",
    value: 45, valueSource: "Australian retail estimate",
  },
  {
    name: "Chivas Regal 18 Year Old Gold Signature",
    producerName: "Chivas Brothers", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Blended Scotch",
    age: 18, abv: 40, caskType: "Fine aged blended",
    description: "Gold Signature. Fine aged blended Scotch whiskies. 1 litre.",
    value: 135, valueSource: "Australian retail estimate",
  },
  {
    name: "Mars Iwai Tradition",
    producerName: "Shinshu Mars Distillery", regionName: "Nagano", country: "Japan",
    category: "whisky", subcategory: "Japanese blended",
    abv: 40,
    description: "Japanese whisky. Produced and bottled by Hombo Shuzo Co., Ltd. 750mL.",
    value: 85, valueSource: "Australian retail estimate",
  },
  {
    name: "Nikka Taketsuru Pure Malt 21 Year Old",
    producerName: "Nikka Whisky", regionName: "Hokkaido", country: "Japan",
    category: "whisky", subcategory: "Japanese blended malt",
    age: 21, abv: 43,
    description: "Pure Malt. Matured in casks. Discontinued expression, highly sought after.",
    value: 420, valueSource: "Secondary market estimate — discontinued expression",
  },
  {
    name: "Balcones Montilla Texas Single Malt Triple Sherry Finished",
    producerName: "Balcones Distilling", regionName: "Texas", country: "USA",
    category: "whisky", subcategory: "American single malt",
    abv: 53, caskType: "Triple Sherry (Montilla)",
    description: "Texas Single Malt Whisky. Created exclusively for The Whisky Club. 700mL.",
    value: 175, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Jim Beam Devil's Cut",
    producerName: "Jim Beam", regionName: "Kentucky", country: "USA",
    category: "whisky", subcategory: "Kentucky straight bourbon",
    abv: 45, caskType: "New American Oak",
    description: "Kentucky Straight Bourbon Whiskey. 90 Proof. 1 litre. Extracted from deep within the barrel stave.",
    value: 60, valueSource: "Australian retail estimate",
  },
  {
    name: "Jim Beam Single Barrel",
    producerName: "Jim Beam", regionName: "Kentucky", country: "USA",
    category: "whisky", subcategory: "Kentucky straight bourbon",
    abv: 47.5, caskType: "New American Oak",
    description: "Kentucky Straight Bourbon Whiskey. The Pride of the Rackhouse. Single barrel selection.",
    value: 75, valueSource: "Australian retail estimate",
  },
  {
    name: "Nikka Gold & Gold",
    producerName: "Nikka Whisky", regionName: "Hokkaido", country: "Japan",
    category: "whisky", subcategory: "Japanese blended",
    abv: 43, caskType: "Pot Still & Coffey Still",
    description: "Gold & Gold. Pot Still & Coffey Still blend. Samurai packaging. Limited to selected duty free outlets in Japan.",
    value: 130, valueSource: "Duty free / secondary market estimate",
  },
  {
    name: "Fuji Single Blended Japanese Whisky",
    producerName: "Fuji Gotemba Distillery", regionName: "Shizuoka", country: "Japan",
    category: "whisky", subcategory: "Japanese blended",
    abv: 43,
    description: "Single Blended Japanese Whisky. Product of Japan / Kirin. 700mL. Whisky Club exclusive.",
    value: 115, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Suntory Plum Liqueur Brandy Base",
    producerName: "Suntory", regionName: "Osaka", country: "Japan",
    category: "spirits", subcategory: "Liqueur",
    abv: 14,
    description: "梅酒 (Umeshu). Brandy Base, long-term aged. Japan duty free exclusive. Plum liqueur.",
    value: 70, valueSource: "Duty free estimate",
  },
  {
    name: "Shin Blended Whisky Mizunara Oak Finish",
    producerName: "Shinobu Distillery", regionName: "Niigata", country: "Japan",
    category: "whisky", subcategory: "Japanese blended",
    caskType: "Mizunara Oak",
    description: "Shinobu Distillery, Niigata Japan. Mizunara Oak Finish. Samurai-themed packaging.",
    value: 175, valueSource: "Australian retail estimate",
  },
  {
    name: "Kura The Whisky Rum Cask Finish",
    producerName: "Helios Distillery", regionName: "Okinawa", country: "Japan",
    category: "whisky", subcategory: "Japanese blended malt",
    caskType: "Rum Cask",
    description: "Blended Malt. Rum Cask Finish. Aged in Okinawan rum casks.",
    value: 105, valueSource: "Australian retail estimate",
  },
];

let added = 0;
for (const bottle of bottles) {
  await addBottle(bottle);
  added++;
}

console.log(`\nAdded ${added} bottles.`);
await db.$disconnect();
