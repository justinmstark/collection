"use client";

import { useRouter } from "next/navigation";

interface CollectionItem {
  id: string;
  customName: string | null;
  status: string;
  product: {
    name: string;
    category: string;
    subcategory: string | null;
    age: number | null;
    abv: number | null;
    smwsCode: string | null;
    producer: { name: string; region: { name: string } | null } | null;
  } | null;
  images: { storageKey: string }[];
}

const MINIO_URL = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL ?? "http://localhost:9000";
const BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET ?? "collection-images";

const STATUS_DOT: Record<string, string> = {
  sealed: "bg-emerald-400",
  open:   "bg-amber-400",
  empty:  "bg-gray-500",
};

const CAT_ICON: Record<string, string> = { whisky: "🥃", wine: "🍷", spirits: "🍸" };

const BOTTLES_PER_SHELF = 8;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function ShelfView({ items }: { items: CollectionItem[] }) {
  const router = useRouter();
  const shelves = chunk(items, BOTTLES_PER_SHELF);

  return (
    <div className="space-y-2">
      {shelves.map((shelf, si) => (
        <div key={si}>
          {/* Bottles row */}
          <div className="flex items-end gap-1 px-3 pt-4">
            {shelf.map((item) => {
              const p = item.product;
              const name = p?.name ?? item.customName ?? "Unknown";
              const imageKey = item.images[0]?.storageKey;
              const imageUrl = imageKey ? `${MINIO_URL}/${BUCKET}/${imageKey}` : null;
              const cat = p?.category ?? "whisky";

              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/collection/${item.id}`)}
                  className="group relative flex-1 flex flex-col items-center cursor-pointer"
                  title={name}
                >
                  {/* Bottle image */}
                  <div className="relative flex items-end justify-center w-full overflow-hidden" style={{ height: 240 }}>
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={name}
                        style={{ height: 240, width: "auto" }}
                        className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 group-hover:drop-shadow-[0_8px_20px_rgba(201,168,76,0.3)] transition-all duration-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="flex items-end justify-center text-5xl pb-2 opacity-40 group-hover:opacity-70 transition-opacity">
                        {CAT_ICON[cat] ?? "🍾"}
                      </div>
                    )}

                    {/* Status dot */}
                    <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${STATUS_DOT[item.status] ?? STATUS_DOT.sealed}`} />

                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 bg-navy-light border border-gold/30 rounded-md px-2.5 py-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                      <p className="font-medium text-gray-100 leading-tight mb-1">{name}</p>
                      {p?.producer?.name && <p className="text-gray-400">{p.producer.name}</p>}
                      <div className="flex gap-2 mt-1 text-gold/80">
                        {p?.age != null && <span>{p.age}yr</span>}
                        {p?.abv != null && <span>{p.abv}%</span>}
                      </div>
                      {p?.smwsCode && <p className="text-gray-500 font-mono mt-0.5">{p.smwsCode}</p>}
                    </div>
                  </div>

                  {/* Label below bottle */}
                  <p className="text-center text-[10px] text-gray-500 truncate w-full mt-1 px-0.5 group-hover:text-gold/70 transition-colors">
                    {p?.smwsCode ?? name.slice(0, 12)}
                  </p>
                  {p?.producer?.name && (
                    <p className="text-center text-[9px] text-gray-600 truncate w-full px-0.5 group-hover:text-gray-400 transition-colors">
                      {p.producer.name}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Pad empty spots on last shelf */}
            {si === shelves.length - 1 &&
              Array.from({ length: BOTTLES_PER_SHELF - shelf.length }).map((_, i) => (
                <div key={`pad-${i}`} className="flex-1" />
              ))}
          </div>

          {/* Shelf plank */}
          <div
            className="mx-0 h-5 rounded-sm shadow-[0_6px_12px_rgba(0,0,0,0.5)]"
            style={{
              background: "linear-gradient(to bottom, #d4aa6a 0%, #b8892e 35%, #96691a 70%, #7a5214 100%)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          />
          {/* Shelf shadow */}
          <div className="h-3" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)" }} />
        </div>
      ))}
    </div>
  );
}
