// This module's fetches run in SERVER components (the Next.js Node process), so
// inside Docker they must reach the API by its compose service name, not localhost
// (localhost there = the web container itself). API_URL_SERVER provides that;
// fall back to the public browser URL for local `npm run dev`.
const API_URL =
  process.env.API_URL_SERVER ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface Envelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

export interface CategoryPrice { minCents: number; maxCents: number; unit: string | null }
export interface CategoryNode {
  id: string;
  key: string;
  name: { en: string; si: string; ta: string };
  price: CategoryPrice | null;
  children: CategoryNode[];
}

/** Server-side fetch of the category tree from the API. */
export async function fetchCategories(): Promise<CategoryNode[]> {
  const res = await fetch(`${API_URL}/categories`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const body = (await res.json()) as Envelope<CategoryNode[]>;
  if (body.error) throw new Error(body.error.code);
  return body.data ?? [];
}
