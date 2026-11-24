/**
 * Browser-side typed fetch wrappers over the slice-1 API routes. Thin: each returns a uniform
 * result so components render success and the server's error message the same way.
 */
import type { MainCard } from "./main-card";
import type { BibCard } from "./bib-card";
import type { IndexCard } from "./index-card";

export type Box = "main" | "bib" | "index";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export interface MainView {
  card: MainCard;
  backlinks: MainCard[];
  children: MainCard[];
  prev: MainCard | null;
  next: MainCard | null;
}
export interface BibView {
  card: BibCard;
  citedBy: MainCard[];
}
export interface IndexView {
  card: IndexCard;
  entries: { address: string; card: MainCard | null }[];
}

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => null);
  if (res.ok) {
    return { ok: true, status: res.status, data: json as T };
  }
  const error = json && typeof json.error === "string" ? json.error : res.statusText;
  return { ok: false, status: res.status, data: null, error };
}

export function createCard(box: Box, body: unknown): Promise<ApiResult<MainCard | BibCard | IndexCard>> {
  return request(`/api/${box}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// The address contains "/" and maps onto the catch-all route, so it is NOT URI-encoded.
export const getMain = (address: string): Promise<ApiResult<MainView>> => request(`/api/main/${address}`);
export const getBib = (slug: string): Promise<ApiResult<BibView>> =>
  request(`/api/bib/${encodeURIComponent(slug)}`);
export const getIndex = (keyword: string): Promise<ApiResult<IndexView>> =>
  request(`/api/index/${encodeURIComponent(keyword)}`);

const postJson = <T,>(url: string, body: unknown): Promise<ApiResult<T>> =>
  request<T>(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const addReadingNote = (slug: string, note: { page: string; note: string }): Promise<ApiResult<BibCard>> =>
  postJson(`/api/bib/${encodeURIComponent(slug)}/notes`, note);

export interface PromoteBody {
  noteIndex: number;
  main: { _id: string; title: string; body: string; links?: string[] };
}
export const promoteNote = (slug: string, body: PromoteBody): Promise<ApiResult<{ main: MainCard; bib: BibCard }>> =>
  postJson(`/api/bib/${encodeURIComponent(slug)}/promote`, body);
