import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";

// Who is looking at the collection. Signed-in users see (and edit) their own items.
// Anonymous visitors get a read-only view of PUBLIC_COLLECTION_EMAIL's collection,
// with prices, valuations and personal notes stripped. Unset = login required.
export type Viewer = { userId: string; readOnly: boolean };

export async function getViewer(): Promise<Viewer | null> {
  const session = await getServerSession(authOptions);
  if (session) return { userId: (session.user as { id: string }).id, readOnly: false };

  const email = process.env.PUBLIC_COLLECTION_EMAIL;
  if (!email) return null;
  const owner = await db.user.findUnique({ where: { email }, select: { id: true } });
  return owner ? { userId: owner.id, readOnly: true } : null;
}

// Remove private fields from an item before showing it to anonymous visitors.
export function publicItem<T extends object>(item: T): T {
  return { ...item, purchasePrice: null, purchaseDate: null, notes: null, valuations: [] };
}
