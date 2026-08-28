"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShelfView from "@/components/ShelfView";

const MINIO_URL = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL ?? "http://localhost:9000";
const BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET ?? "collection-images";

interface CollectionItem {
  id: string;
  customName: string | null;
  status: string;
  quantity: number;
  product: {
    name: string;
    category: string;
    subcategory: string | null;
    age: number | null;
    abv: number | null;
    caskType: string | null;
    smwsCode: string | null;
    producer: { name: string; region: { name: string; country: string } | null } | null;
  } | null;
  images: { storageKey: string }[];
  valuations?: { value: number }[];
}

const CATEGORIES = ["All", "whisky", "wine", "spirits"];

const STATUS_STYLE: Record<string, string> = {
  sealed: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40",
  open:   "bg-amber-900/60 text-amber-300 border border-amber-700/40",
  empty:  "bg-gray-800/60 text-gray-400 border border-gray-700/40",
};

const CAT_ICON: Record<string, string> = { whisky: "🥃", wine: "🍷", spirits: "🍸" };

type SortKey = "name" | "distillery" | "region" | "subcategory" | "age" | "abv" | "caskType" | "status" | "value";
type SortDir = "asc" | "desc";

function sortValue(item: CollectionItem, key: SortKey): string | number {
  const p = item.product;
  switch (key) {
    case "name":       return (p?.name ?? item.customName ?? "").toLowerCase();
    case "distillery": return (p?.producer?.name ?? "").toLowerCase();
    case "region":     return (p?.producer?.region?.name ?? "").toLowerCase();
    case "subcategory":return (p?.subcategory ?? "").toLowerCase();
    case "caskType":   return (p?.caskType ?? "").toLowerCase();
    case "age":        return p?.age ?? 999;
    case "abv":        return p?.abv ?? 0;
    case "status":     return item.status;
    case "value":      return item.valuations?.[0]?.value ?? 0;
    default:           return "";
  }
}

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: SortDir }) {
  if (col !== active) return <span className="text-gray-700 ml-1">↕</span>;
  return <span className="text-gold ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<"table" | "shelf">("table");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch("/api/collection")
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const totalValue = useMemo(() =>
    items.reduce((sum, i) => sum + (i.valuations?.[0]?.value ?? 0) * i.quantity, 0),
  [items]);

  const filtered = useMemo(() => {
    let rows = items;
    if (activeCategory !== "All") rows = rows.filter((i) => i.product?.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((i) =>
        (i.product?.name ?? i.customName ?? "").toLowerCase().includes(q) ||
        (i.product?.producer?.name ?? "").toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, activeCategory, search, sortKey, sortDir]);

  if (status === "loading" || status === "unauthenticated") {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;
  }

  function ColHeader({ label, col, className }: { label: string; col: SortKey; className?: string }) {
    return (
      <th
        className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:text-gold transition-colors whitespace-nowrap ${className ?? ""}`}
        onClick={() => handleSort(col)}
      >
        {label}<SortIcon col={col} active={sortKey} dir={sortDir} />
      </th>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-serif text-gold">My Collection</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded overflow-hidden border border-gold/20">
            <button onClick={() => setView("table")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "table" ? "bg-gold text-navy" : "bg-navy-light text-gray-400 hover:text-gold"}`}>
              ≡ Table
            </button>
            <button onClick={() => setView("shelf")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "shelf" ? "bg-gold text-navy" : "bg-navy-light text-gray-400 hover:text-gold"}`}>
              ⬛ Shelf
            </button>
          </div>
          <a
            href="/api/collection/export"
            download
            className="bg-navy-light hover:bg-navy-mid border border-gold/20 text-gold font-semibold px-3 py-2 rounded text-sm transition-colors"
          >
            ↓ Export PDF
          </a>
          <Link
            href="/collection/add"
            className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded text-sm transition-colors"
          >
            + Add Bottle
          </Link>
        </div>
      </div>

      {/* Collection value */}
      {!loading && totalValue > 0 && (
        <div className="flex justify-end mb-4 -mt-3">
          <span className="text-xs text-gray-500">
            Total collection value:{" "}
            <span className="text-gold font-semibold text-sm">
              {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(totalValue)}
            </span>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                activeCategory === cat
                  ? "bg-gold text-navy"
                  : "bg-navy-light text-gray-400 hover:text-gold border border-gold/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or distillery…"
          className="flex-1 min-w-[200px] max-w-xs text-sm py-1 px-3 bg-navy-light border border-white/10 rounded-md text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold/40"
        />
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {filtered.length} bottle{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Shelf View */}
      {view === "shelf" && (
        <div className="bg-navy rounded-lg overflow-hidden border border-gold/10 py-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No bottles</div>
          ) : (
            <ShelfView items={filtered} />
          )}
        </div>
      )}

      {/* Table */}
      {view === "table" && <div className="border border-gold/15 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-light sticky top-0 z-10 border-b border-gold/15">
              <tr>
                <th className="w-14 px-3 py-2.5" />
                <ColHeader label="Name" col="name" />
                <ColHeader label="Distillery" col="distillery" className="hidden md:table-cell" />
                <ColHeader label="Region" col="region" className="hidden lg:table-cell" />
                <ColHeader label="Style" col="subcategory" className="hidden md:table-cell" />
                <ColHeader label="Age" col="age" className="text-right" />
                <ColHeader label="ABV" col="abv" className="text-right" />
                <ColHeader label="Cask" col="caskType" className="hidden lg:table-cell" />
                <ColHeader label="Status" col="status" />
                <ColHeader label="Value" col="value" className="text-right hidden lg:table-cell" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 bg-navy-light rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-gray-500 text-sm">
                    {search ? "No bottles match your search" : "No bottles yet — add your first bottle above"}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const p = item.product;
                  const imageKey = item.images[0]?.storageKey;
                  const displayName = p?.name ?? item.customName ?? "Unnamed Bottle";
                  const latestValue = item.valuations?.[0]?.value;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/collection/${item.id}`)}
                      className="cursor-pointer hover:bg-navy-light transition-colors group"
                    >
                      {/* Thumbnail */}
                      <td className="w-14 px-3 py-2">
                        <div className="w-10 h-10 rounded overflow-hidden bg-navy-mid flex items-center justify-center text-xl shrink-0">
                          {imageKey ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`${MINIO_URL}/${BUCKET}/${imageKey}`}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            CAT_ICON[p?.category ?? "whisky"] ?? "🍾"
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-3 py-2 max-w-[220px]">
                        <span className="text-gray-100 group-hover:text-gold-light transition-colors font-medium truncate block leading-tight">
                          {displayName}
                        </span>
                        {p?.smwsCode && (
                          <span className="text-xs text-gray-500 font-mono">{p.smwsCode}</span>
                        )}
                      </td>

                      {/* Distillery */}
                      <td className="px-3 py-2 text-gray-400 hidden md:table-cell whitespace-nowrap">
                        {p?.producer?.name ?? "—"}
                      </td>

                      {/* Region */}
                      <td className="px-3 py-2 text-gray-400 hidden lg:table-cell whitespace-nowrap">
                        {p?.producer?.region?.name ?? "—"}
                      </td>

                      {/* Style */}
                      <td className="px-3 py-2 text-gray-400 capitalize hidden md:table-cell whitespace-nowrap">
                        {p?.subcategory ?? p?.category ?? "—"}
                      </td>

                      {/* Age */}
                      <td className="px-3 py-2 text-right text-gray-300 whitespace-nowrap">
                        {p?.age != null ? `${p.age} yr` : <span className="text-gray-600">NAS</span>}
                      </td>

                      {/* ABV */}
                      <td className="px-3 py-2 text-right text-gray-300 whitespace-nowrap">
                        {p?.abv != null ? `${p.abv}%` : <span className="text-gray-600">—</span>}
                      </td>

                      {/* Cask */}
                      <td className="px-3 py-2 text-gray-400 hidden lg:table-cell whitespace-nowrap">
                        {p?.caskType ?? "—"}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[item.status] ?? STATUS_STYLE.sealed}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="px-3 py-2 text-right text-gray-300 hidden lg:table-cell whitespace-nowrap">
                        {latestValue != null
                          ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(latestValue)
                          : <span className="text-gray-600">—</span>
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}
