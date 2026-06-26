const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface Envelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

export interface CategoryNode {
  id: string;
  key: string;
  name: { en: string; si: string; ta: string };
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
