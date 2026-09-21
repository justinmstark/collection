import OpenAI from "openai";

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  return _client;
}

export interface BottleIdentification {
  name: string | null;
  producer: string | null;
  region: string | null;
  country: string | null;
  category: "whisky" | "wine" | "spirits" | null;
  subcategory: string | null;
  age: number | null;
  abv: number | null;
  caskType: string | null;
  description: string | null;
  smwsCode: string | null;
  confidence: "high" | "medium" | "low";
}

const MULTI_PROMPT = `Identify ALL bottles of whisky, wine, or spirits visible in this image. For each bottle you can identify, extract its details. For SMWS bottles extract the code (e.g. "63.105"). Return ONLY a valid JSON array with no markdown — each element must match this schema:
{
  "name": "full bottle name",
  "producer": "distillery or producer name",
  "region": "region (e.g. Speyside, Islay)",
  "country": "country of origin",
  "category": "whisky|wine|spirits",
  "subcategory": "e.g. single malt, bourbon",
  "age": null or integer years,
  "abv": null or float percentage,
  "caskType": "e.g. ex-bourbon, sherry",
  "description": "brief description from label",
  "smwsCode": null or "distillery.bottling",
  "confidence": "high|medium|low"
}
If only one bottle is visible, return a single-element array. If no bottles are identifiable, return [].`;

const SINGLE_PROMPT = `Identify this bottle of whisky, wine, or spirits. If it is an SMWS (Scotch Malt Whisky Society) bottle, extract the SMWS code (format: distillery_number.bottling_number, e.g. "63.105"). Return ONLY valid JSON matching this schema, no markdown:
{
  "name": "full bottle name",
  "producer": "distillery or producer name",
  "region": "region (e.g. Speyside, Islay, Bordeaux)",
  "country": "country of origin",
  "category": "whisky|wine|spirits",
  "subcategory": "e.g. single malt, bourbon, red wine",
  "age": null or integer years,
  "abv": null or float percentage,
  "caskType": "e.g. ex-bourbon, sherry, STR",
  "description": "brief tasting notes or description from label",
  "smwsCode": null or "distillery.bottling" e.g. "63.105",
  "confidence": "high|medium|low"
}`;

async function callVision(imageBase64: string, mediaType: string, prompt: string, maxTokens: number): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
          { type: "text", text: prompt },
        ],
      },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

export async function identifyBottles(imageBase64: string, mediaType: string): Promise<BottleIdentification[]> {
  const text = await callVision(imageBase64, mediaType, MULTI_PROMPT, 4096);
  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export async function identifyBottle(imageBase64: string, mediaType: string): Promise<BottleIdentification> {
  const text = await callVision(imageBase64, mediaType, SINGLE_PROMPT, 1024);
  const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return {
      name: null, producer: null, region: null, country: null,
      category: null, subcategory: null, age: null, abv: null,
      caskType: null, description: null, smwsCode: null, confidence: "low",
    };
  }
}
