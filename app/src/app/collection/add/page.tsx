"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface BottleData {
  name: string;
  producer: string;
  region: string;
  country: string;
  category: string;
  subcategory: string;
  age: string;
  abv: string;
  caskType: string;
  description: string;
  smwsCode: string;
  vintage: string;
  drinkFrom: string;
  drinkUntil: string;
}

interface DetectedBottle extends BottleData {
  confidence: string;
  selected: boolean;
  enriching: boolean;
  productImageUrl: string | null;
  price: number | null;
}

const empty: BottleData = {
  name: "", producer: "", region: "", country: "",
  category: "whisky", subcategory: "", age: "", abv: "",
  caskType: "", description: "", smwsCode: "",
  vintage: "", drinkFrom: "", drinkUntil: "",
};

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  medium: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  low: "bg-gray-800/60 text-gray-400 border-gray-700/40",
};

export default function AddBottlePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "detecting" | "select" | "form" | "saving">("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detected, setDetected] = useState<DetectedBottle[]>([]);
  const [savingProgress, setSavingProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");

  // Single-bottle form state (for manual / skip flow)
  const [form, setForm] = useState<BottleData>(empty);
  const [extra, setExtra] = useState({ quantity: "1", purchasePrice: "", purchaseDate: "", status: "sealed", notes: "" });
  const [singleEnriching, setSingleEnriching] = useState(false);
  const [singleProductImageUrl, setSingleProductImageUrl] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!session) return <div className="text-gray-500 flex items-center justify-center h-64">Redirecting…</div>;

  function handleFile(file: File) {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleIdentify() {
    if (!imageFile) return;
    setStep("detecting");
    setError("");

    const fd = new FormData();
    fd.append("image", imageFile);
    const res = await fetch("/api/bottles/identify-multi", { method: "POST", body: fd });

    if (!res.ok) {
      setError("Identification failed — try again or add manually");
      setStep("upload");
      return;
    }

    const bottles: Array<Record<string, unknown>> = await res.json();

    if (bottles.length === 0) {
      setError("No bottles identified — try a clearer photo or add manually");
      setStep("upload");
      return;
    }

    if (bottles.length === 1) {
      // Single bottle: go to the detailed form flow
      const b = bottles[0];
      const bottleForm: BottleData = {
        name: (b.name as string) ?? "",
        producer: (b.producer as string) ?? "",
        region: (b.region as string) ?? "",
        country: (b.country as string) ?? "",
        category: (b.category as string) ?? "whisky",
        subcategory: (b.subcategory as string) ?? "",
        age: b.age != null ? String(b.age) : "",
        abv: b.abv != null ? String(b.abv) : "",
        caskType: (b.caskType as string) ?? "",
        description: (b.description as string) ?? "",
        smwsCode: (b.smwsCode as string) ?? "",
        vintage: "",
        drinkFrom: "",
        drinkUntil: "",
      };
      setForm(bottleForm);
      setConfidence((b.confidence as string) ?? null);
      setStep("form");

      if (b.name) {
        setSingleEnriching(true);
        fetch("/api/bottles/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: b.name, producer: b.producer ?? "" }),
        })
          .then(r => r.ok ? r.json() : null)
          .then(enriched => {
            if (!enriched) return;
            if (enriched.imageUrl) setSingleProductImageUrl(enriched.imageUrl);
            if (enriched.price) setExtra(prev => ({ ...prev, purchasePrice: String(enriched.price) }));
          })
          .finally(() => setSingleEnriching(false));
      }
      return;
    }

    // Multiple bottles: go to selection view, enrich each in parallel
    const initial: DetectedBottle[] = bottles.map(b => ({
      name: (b.name as string) ?? "",
      producer: (b.producer as string) ?? "",
      region: (b.region as string) ?? "",
      country: (b.country as string) ?? "",
      category: (b.category as string) ?? "whisky",
      subcategory: (b.subcategory as string) ?? "",
      age: b.age != null ? String(b.age) : "",
      abv: b.abv != null ? String(b.abv) : "",
      caskType: (b.caskType as string) ?? "",
      description: (b.description as string) ?? "",
      smwsCode: (b.smwsCode as string) ?? "",
      confidence: (b.confidence as string) ?? "low",
      selected: true,
      enriching: true,
      productImageUrl: null,
      price: null,
    }));

    setDetected(initial);
    setStep("select");

    // Enrich each bottle in parallel
    initial.forEach((bottle, idx) => {
      if (!bottle.name) {
        setDetected(prev => prev.map((b, i) => i === idx ? { ...b, enriching: false } : b));
        return;
      }
      fetch("/api/bottles/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: bottle.name, producer: bottle.producer }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(enriched => {
          setDetected(prev => prev.map((b, i) =>
            i === idx
              ? { ...b, enriching: false, productImageUrl: enriched?.imageUrl ?? null, price: enriched?.price ?? null }
              : b
          ));
        })
        .catch(() => {
          setDetected(prev => prev.map((b, i) => i === idx ? { ...b, enriching: false } : b));
        });
    });
  }

  async function saveBottle(bottle: DetectedBottle): Promise<void> {
    const productRes = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: bottle.name, producer: bottle.producer, region: bottle.region,
        country: bottle.country, category: bottle.category, subcategory: bottle.subcategory,
        age: bottle.age, abv: bottle.abv, caskType: bottle.caskType,
        description: bottle.description, smwsCode: bottle.smwsCode,
      }),
    });
    const product = productRes.ok ? await productRes.json() : null;

    const itemRes = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product?.id ?? null,
        customName: bottle.name || null,
        quantity: 1,
        purchasePrice: bottle.price ?? null,
        status: "sealed",
        valuationSource: "Market price estimate (auto-sourced at time of adding)",
      }),
    });
    if (!itemRes.ok) return;
    const item = await itemRes.json();

    if (bottle.productImageUrl) {
      await fetch(`/api/collection/${item.id}/images/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bottle.productImageUrl }),
      });
    }
  }

  async function handleAddSelected() {
    const toAdd = detected.filter(b => b.selected);
    if (toAdd.length === 0) return;
    setStep("saving");
    setSavingProgress({ done: 0, total: toAdd.length });
    for (const bottle of toAdd) {
      await saveBottle(bottle);
      setSavingProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null);
    }
    router.push("/");
  }

  // Single-bottle form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let productId: string | null = null;
    if (form.name) {
      const pr = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (pr.ok) productId = (await pr.json()).id;
    }

    const ir = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        customName: form.name || null,
        ...extra,
        valuationSource: singleProductImageUrl
          ? "Market price estimate (auto-sourced at time of adding)"
          : "Purchase price (manually entered)",
      }),
    });
    if (!ir.ok) { setError("Failed to save"); setSaving(false); return; }
    const item = await ir.json();

    if (singleProductImageUrl) {
      await fetch(`/api/collection/${item.id}/images/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: singleProductImageUrl }),
      });
    } else if (imageFile) {
      const fd = new FormData();
      fd.append("image", imageFile);
      await fetch(`/api/collection/${item.id}/images`, { method: "POST", body: fd });
    }

    router.push(`/collection/${item.id}`);
  }

  function field(label: string, key: keyof BottleData, opts?: { type?: string; placeholder?: string }) {
    return (
      <div>
        <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
        <input
          type={opts?.type ?? "text"}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={opts?.placeholder}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-gold">Add Bottle</h1>
        <p className="text-gray-500 text-sm mt-1">
          {step === "upload" && "Upload a photo — single bottle or a whole shelf"}
          {step === "detecting" && "Identifying bottles…"}
          {step === "select" && `${detected.length} bottle${detected.length !== 1 ? "s" : ""} detected — select which to add`}
          {step === "form" && "Review and confirm the details"}
          {step === "saving" && "Adding to your collection…"}
        </p>
      </div>

      {/* Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gold/30 hover:border-gold/60 rounded-lg p-12 text-center cursor-pointer transition-colors bg-navy-light"
          >
            {preview ? (
              <div className="relative w-full h-64">
                <Image src={preview} alt="Preview" fill className="object-contain rounded" unoptimized />
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-4">📷</div>
                <p className="text-gray-400">Drop a photo here or click to browse</p>
                <p className="text-gray-600 text-xs mt-1">Single bottle or a full shelf — Claude will find them all</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleIdentify}
              disabled={!imageFile}
              className="flex-1 bg-gold hover:bg-gold-light disabled:opacity-40 text-navy font-semibold py-3 rounded-md text-sm transition-colors"
            >
              Identify with Claude
            </button>
            <button
              onClick={() => setStep("form")}
              className="px-5 py-3 border border-gold/30 hover:border-gold/60 text-gold text-sm rounded-md transition-colors"
            >
              Add Manually
            </button>
          </div>
        </div>
      )}

      {/* Detecting spinner */}
      {step === "detecting" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Scanning for bottles…</p>
          {preview && (
            <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-gold/20 opacity-50">
              <Image src={preview} alt="Scanning" fill className="object-contain" unoptimized />
            </div>
          )}
        </div>
      )}

      {/* Multi-bottle selection */}
      {step === "select" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={detected.every(b => b.selected)}
                onChange={(e) => setDetected(prev => prev.map(b => ({ ...b, selected: e.target.checked })))}
                className="accent-gold"
              />
              Select all
            </label>
            <span className="text-xs text-gray-500">{detected.filter(b => b.selected).length} of {detected.length} selected</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {detected.map((bottle, idx) => (
              <div
                key={idx}
                onClick={() => setDetected(prev => prev.map((b, i) => i === idx ? { ...b, selected: !b.selected } : b))}
                className={`relative rounded-lg border cursor-pointer transition-all ${
                  bottle.selected
                    ? "border-gold/50 bg-navy-light shadow-[0_0_12px_rgba(201,168,76,0.15)]"
                    : "border-gray-700/40 bg-gray-900/40 opacity-50"
                }`}
              >
                {/* Image area */}
                <div className="relative h-36 rounded-t-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                  {bottle.enriching ? (
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      <div className="w-5 h-5 border border-gold/20 border-t-gold/60 rounded-full animate-spin" />
                      <span className="text-[10px]">Finding image…</span>
                    </div>
                  ) : bottle.productImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bottle.productImageUrl} alt={bottle.name} className="h-full w-auto max-w-full object-contain" />
                  ) : (
                    <span className="text-4xl opacity-30">{bottle.category === "wine" ? "🍷" : bottle.category === "spirits" ? "🍸" : "🥃"}</span>
                  )}
                  {/* Confidence badge */}
                  <span className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded border ${CONFIDENCE_STYLE[bottle.confidence] ?? CONFIDENCE_STYLE.low}`}>
                    {bottle.confidence}
                  </span>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={bottle.selected}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-1.5 left-1.5 accent-gold"
                  />
                </div>

                {/* Info */}
                <div className="p-3 space-y-0.5">
                  <p className="text-xs font-medium text-gray-100 leading-tight line-clamp-2">{bottle.name || "Unknown"}</p>
                  {bottle.producer && <p className="text-[10px] text-gray-500 truncate">{bottle.producer}</p>}
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {bottle.age && <span className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">{bottle.age}yr</span>}
                    {bottle.abv && <span className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">{bottle.abv}%</span>}
                    {bottle.price != null ? (
                      <span className="text-[9px] px-1.5 py-0.5 bg-gold/10 text-gold/80 rounded">${bottle.price}</span>
                    ) : bottle.enriching ? (
                      <span className="text-[9px] text-gray-600">pricing…</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleAddSelected}
              disabled={detected.filter(b => b.selected).length === 0}
              className="flex-1 bg-gold hover:bg-gold-light disabled:opacity-40 text-navy font-semibold py-3 rounded-md text-sm transition-colors"
            >
              Add {detected.filter(b => b.selected).length} Bottle{detected.filter(b => b.selected).length !== 1 ? "s" : ""} to Collection
            </button>
            <button
              onClick={() => { setStep("upload"); setDetected([]); setError(""); }}
              className="px-5 py-3 border border-gold/30 hover:border-gold/60 text-gold text-sm rounded-md transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Saving progress */}
      {step === "saving" && savingProgress && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-gray-300 text-sm">Adding bottle {savingProgress.done + 1} of {savingProgress.total}…</p>
            <div className="mt-3 h-1.5 w-48 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-300"
                style={{ width: `${(savingProgress.done / savingProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Single-bottle form */}
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {confidence && (
            <div className={`text-sm px-4 py-2 rounded border ${CONFIDENCE_STYLE[confidence] ?? CONFIDENCE_STYLE.low}`}>
              Claude identified this with <strong>{confidence}</strong> confidence — review below
            </div>
          )}
          {singleEnriching && (
            <div className="text-sm px-4 py-2 rounded border bg-navy-light border-gold/20 text-gold/60 animate-pulse">
              Finding product image and price…
            </div>
          )}
          {!singleEnriching && singleProductImageUrl && (
            <div className="text-sm px-4 py-2 rounded border bg-emerald-900/20 border-emerald-700/30 text-emerald-400">
              Product image found — background will be removed on save
            </div>
          )}
          {preview && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gold/20">
              <Image src={preview} alt="Bottle" fill className="object-contain" unoptimized />
            </div>
          )}

          <div className="bg-navy-light border border-gold/15 rounded-lg p-6 space-y-4">
            <h2 className="text-gold text-sm uppercase tracking-wider font-semibold">Bottle Details</h2>
            {field("Name *", "name", { placeholder: "e.g. Dangerously Gorgeous" })}
            {field("Producer / Distillery", "producer", { placeholder: "e.g. Glenfarclas" })}
            {field("SMWS Code", "smwsCode", { placeholder: "e.g. 1.234" })}
            <div className="grid grid-cols-2 gap-4">
              {field("Region", "region", { placeholder: "e.g. Speyside" })}
              {field("Country", "country", { placeholder: "e.g. Scotland" })}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="whisky">Whisky</option>
                <option value="wine">Wine</option>
                <option value="spirits">Spirits</option>
              </select>
            </div>
            {field("Subcategory", "subcategory", { placeholder: "e.g. single malt, bourbon" })}
            {form.category === "wine" && (
              <div className="grid grid-cols-3 gap-4">
                {field("Vintage", "vintage", { type: "number", placeholder: "2022" })}
                {field("Drink From", "drinkFrom", { type: "number", placeholder: "2025" })}
                {field("Drink Until", "drinkUntil", { type: "number", placeholder: "2032" })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {field("Age (years)", "age", { type: "number", placeholder: "12" })}
              {field("ABV (%)", "abv", { type: "number", placeholder: "46.0" })}
            </div>
            {form.category !== "wine" && field("Cask Type", "caskType", { placeholder: "e.g. ex-bourbon, sherry" })}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Description / Tasting Notes</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Flavour notes, aromas…" />
            </div>
          </div>

          <div className="bg-navy-light border border-gold/15 rounded-lg p-6 space-y-4">
            <h2 className="text-gold text-sm uppercase tracking-wider font-semibold">Your Bottle</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Quantity</label>
                <input type="number" min="1" value={extra.quantity} onChange={(e) => setExtra({ ...extra, quantity: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Status</label>
                <select value={extra.status} onChange={(e) => setExtra({ ...extra, status: e.target.value })}>
                  <option value="sealed">Sealed</option>
                  <option value="open">Open</option>
                  <option value="empty">Empty</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Purchase Price</label>
                <input type="number" step="0.01" placeholder="0.00" value={extra.purchasePrice} onChange={(e) => setExtra({ ...extra, purchasePrice: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Purchase Date</label>
                <input type="date" value={extra.purchaseDate} onChange={(e) => setExtra({ ...extra, purchaseDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Personal Notes</label>
              <textarea rows={2} placeholder="Your tasting notes…" value={extra.notes} onChange={(e) => setExtra({ ...extra, notes: e.target.value })} />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving || !form.name} className="flex-1 bg-gold hover:bg-gold-light disabled:opacity-40 text-navy font-semibold py-3 rounded-md text-sm transition-colors">
              {saving ? "Saving…" : "Add to Collection"}
            </button>
            <button type="button" onClick={() => setStep("upload")} className="px-5 py-3 border border-gold/30 hover:border-gold/60 text-gold text-sm rounded-md transition-colors">
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
