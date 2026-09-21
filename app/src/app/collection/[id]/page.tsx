"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MINIO_URL = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL ?? "http://localhost:9000";
const BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET ?? "collection-images";

function imgUrl(key: string) {
  return `${MINIO_URL}/${BUCKET}/${key}`;
}

interface ItemImage { id: string; storageKey: string; isPrimary: boolean }
interface Valuation { value: number; valuedAt: string; source: string | null }
interface Item {
  id: string;
  customName: string | null;
  status: string;
  quantity: number;
  purchasePrice: number | null;
  purchaseDate: string | null;
  notes: string | null;
  product: {
    id: string;
    name: string;
    category: string;
    subcategory: string | null;
    age: number | null;
    abv: number | null;
    caskType: string | null;
    description: string | null;
    smwsCode: string | null;
    vintage: number | null;
    drinkFrom: number | null;
    drinkUntil: number | null;
    producer: { name: string; region: { name: string; country: string } | null } | null;
  } | null;
  images: ItemImage[];
  valuations: Valuation[];
}

interface ImageResult { url: string; title: string; source: string }

const STATUS_COLORS: Record<string, string> = {
  sealed: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40",
  open: "bg-amber-900/60 text-amber-300 border border-amber-700/40",
  empty: "bg-gray-800/60 text-gray-400 border border-gray-700/40",
};

export default function BottleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [quantitySaving, setQuantitySaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editDescription, setEditDescription] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  const [findingImages, setFindingImages] = useState(false);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchItem() {
    const res = await fetch(`/api/collection/${id}`);
    if (!res.ok) { router.push("/"); return; }
    const data: Item = await res.json();
    setItem(data);
    setEditNotes(data.notes ?? "");
    setEditDescription(data.product?.description ?? "");
    const primary = data.images.find((i) => i.isPrimary) ?? data.images[0];
    setActiveImage(primary?.storageKey ?? null);
    setLoading(false);
  }

  useEffect(() => { if (status === "authenticated") fetchItem(); }, [status, id]);

  async function handleStatusChange(newStatus: string) {
    if (!item) return;
    setStatusSaving(true);
    await fetch(`/api/collection/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setItem({ ...item, status: newStatus });
    setStatusSaving(false);
  }

  async function handleQuantityChange(newQty: number) {
    if (!item || newQty < 1 || quantitySaving) return;
    setQuantitySaving(true);
    await fetch(`/api/collection/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    setItem({ ...item, quantity: newQty });
    setQuantitySaving(false);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await fetch(`/api/collection/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: editNotes }),
    });
    setSavingNotes(false);
    if (item) setItem({ ...item, notes: editNotes });
  }

  async function handleSaveDescription() {
    if (!item?.product) return;
    setSavingDescription(true);
    await fetch(`/api/products/${item.product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: editDescription }),
    });
    setSavingDescription(false);
    if (item) setItem({ ...item, product: { ...item.product, description: editDescription } });
  }

  async function handleDelete() {
    if (!confirm("Delete this bottle from your collection?")) return;
    setDeleting(true);
    await fetch(`/api/collection/${id}`, { method: "DELETE" });
    router.push("/");
  }

  async function handleFindImages() {
    setFindingImages(true);
    setShowImageSearch(true);
    setImageResults([]);
    const res = await fetch(`/api/collection/${id}/find-image`);
    if (res.ok) setImageResults(await res.json());
    setFindingImages(false);
  }

  async function handleUseImage(url: string) {
    setDownloadingUrl(url);
    const res = await fetch(`/api/collection/${id}/images/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setDownloadingUrl(null);
    if (res.ok) {
      setShowImageSearch(false);
      setImageResults([]);
      setPasteUrl("");
      await fetchItem();
    } else {
      alert("Failed to download image");
    }
  }

  if (loading || !item) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-navy-light rounded w-1/3" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-96 bg-navy-light rounded-lg" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-6 bg-navy-light rounded" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = item.product?.name ?? item.customName ?? "Unnamed Bottle";
  const producer = item.product?.producer;
  const p = item.product;

  const specs = [
    p?.smwsCode && { label: "SMWS Code", value: <span className="font-mono">{p.smwsCode}</span> },
    producer && { label: p?.category === "wine" ? "Producer" : "Distillery", value: producer.name },
    producer?.region && { label: "Region", value: `${producer.region.name}, ${producer.region.country}` },
    p?.category && { label: "Category", value: p.category },
    p?.subcategory && { label: "Style", value: p.subcategory },
    p?.vintage && { label: "Vintage", value: p.vintage },
    p?.drinkFrom && p?.drinkUntil && { label: "Drink Window", value: `${p.drinkFrom} – ${p.drinkUntil}` },
    p?.drinkFrom && !p?.drinkUntil && { label: "Drink From", value: p.drinkFrom },
    !p?.drinkFrom && p?.drinkUntil && { label: "Drink Until", value: p.drinkUntil },
    p?.age && { label: "Age", value: `${p.age} years` },
    p?.abv && { label: "ABV", value: `${p.abv}%` },
    p?.caskType && { label: "Cask", value: p.caskType },
    item.quantity > 0 && {
      label: "Quantity",
      value: (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1 || quantitySaving}
            className="w-6 h-6 flex items-center justify-center rounded border border-gold/30 text-gold hover:border-gold/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm leading-none"
          >−</button>
          <span>{item.quantity} {item.quantity === 1 ? "bottle" : "bottles"}</span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={quantitySaving}
            className="w-6 h-6 flex items-center justify-center rounded border border-gold/30 text-gold hover:border-gold/60 disabled:opacity-30 transition-colors text-sm leading-none"
          >+</button>
        </div>
      ),
    },
    item.purchasePrice && { label: "Purchase Price", value: `$${item.purchasePrice.toFixed(2)}` },
    item.purchaseDate && { label: "Purchased", value: new Date(item.purchaseDate).toLocaleDateString() },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[];

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.push("/")} className="text-gray-500 hover:text-gold text-sm mb-6 flex items-center gap-1 transition-colors">
        ← Collection
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative w-full aspect-[3/4] bg-navy-light rounded-lg overflow-hidden border border-gold/15">
            {activeImage ? (
              <Image
                src={imgUrl(activeImage)}
                alt={displayName}
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-6xl">
                {p?.category === "wine" ? "🍷" : p?.category === "spirits" ? "🍸" : "🥃"}
              </div>
            )}
          </div>

          {item.images.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {item.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.storageKey)}
                  className={`relative w-16 h-20 rounded overflow-hidden border transition-colors ${
                    activeImage === img.storageKey ? "border-gold" : "border-gold/20 hover:border-gold/50"
                  }`}
                >
                  <Image src={imgUrl(img.storageKey)} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-3">
            <button
              onClick={handleFindImages}
              disabled={findingImages}
              className="w-full py-2.5 border border-gold/30 hover:border-gold/60 text-gold text-sm rounded-md transition-colors disabled:opacity-50"
            >
              {findingImages ? "Searching…" : "Find Image Online"}
            </button>

            {showImageSearch && (
              <div className="bg-navy-light border border-gold/15 rounded-lg p-4 space-y-4">
                {findingImages ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-navy-mid rounded animate-pulse" />)}
                  </div>
                ) : imageResults.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {imageResults.map((result, i) => (
                      <div key={i} className="group relative">
                        <div className="aspect-square bg-navy-mid rounded overflow-hidden border border-gold/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={result.url}
                            alt={result.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-1">{result.source}</p>
                        <button
                          onClick={() => handleUseImage(result.url)}
                          disabled={downloadingUrl === result.url}
                          className="mt-1 w-full text-xs py-1 bg-gold/10 hover:bg-gold/20 text-gold rounded border border-gold/20 transition-colors disabled:opacity-50"
                        >
                          {downloadingUrl === result.url ? "Saving…" : "Use this"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center">No results found</p>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-2">Or paste an image URL:</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={pasteUrl}
                      onChange={(e) => setPasteUrl(e.target.value)}
                      placeholder="https://…"
                      className="text-sm"
                    />
                    <button
                      onClick={() => pasteUrl && handleUseImage(pasteUrl)}
                      disabled={!pasteUrl || downloadingUrl === pasteUrl}
                      className="px-3 py-2 bg-gold/10 hover:bg-gold/20 text-gold text-xs rounded border border-gold/20 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {downloadingUrl === pasteUrl ? "Saving…" : "Use URL"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-serif text-gold leading-tight">{displayName}</h1>
              <span className={`shrink-0 text-xs px-3 py-1 rounded-full ${STATUS_COLORS[item.status] ?? STATUS_COLORS.sealed}`}>
                {item.status}
              </span>
            </div>
            {producer && (
              <p className="text-gray-400 mt-1">{producer.name}</p>
            )}
          </div>

          <div className="bg-navy-light border border-gold/15 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {specs.map(({ label, value }, i) => (
                  <tr key={i} className="border-b border-gold/10 last:border-0">
                    <td className="px-4 py-2.5 text-gray-500 w-1/3">{label}</td>
                    <td className="px-4 py-2.5 text-gray-200">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider">
                {p?.category === "wine" ? "Tasting Notes" : "Description"}
              </h3>
              <button
                onClick={() => { setEditingDescription(!editingDescription); setEditDescription(p?.description ?? ""); }}
                className="text-xs text-gray-500 hover:text-gold transition-colors"
              >
                {editingDescription ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingDescription ? (
              <>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  placeholder={p?.category === "wine" ? "Flavours, aromas, food pairing…" : "Description…"}
                  className="w-full text-sm bg-navy-light border border-white/10 rounded p-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold/40 resize-none"
                />
                <button
                  onClick={async () => { await handleSaveDescription(); setEditingDescription(false); }}
                  disabled={savingDescription}
                  className="mt-2 text-xs px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded border border-gold/20 transition-colors"
                >
                  {savingDescription ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <div className="bg-navy-light border border-gold/10 rounded-lg px-4 py-3 min-h-[4rem]">
                {p?.description ? (
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                ) : (
                  <p className="text-sm text-gray-600 italic">
                    {p?.category === "wine" ? "No tasting notes added" : "No description added"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</h3>
            <div className="flex gap-2">
              {["sealed", "open", "empty"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={statusSaving}
                  className={`px-4 py-2 rounded-md text-sm capitalize border transition-colors ${
                    item.status === s
                      ? "bg-gold/20 border-gold text-gold"
                      : "border-gold/20 text-gray-400 hover:border-gold/40 hover:text-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Personal Notes</h3>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={4}
              placeholder="Your tasting notes, memories…"
            />
            {editNotes !== (item.notes ?? "") && (
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 text-xs px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded border border-gold/20 transition-colors"
              >
                {savingNotes ? "Saving…" : "Save notes"}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-gold/10">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-500/70 hover:text-red-400 transition-colors"
            >
              {deleting ? "Deleting…" : "Remove from collection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
