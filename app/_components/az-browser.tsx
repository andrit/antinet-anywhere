"use client";
import { useState } from "react";
import type { ApiResult, BrowseItem } from "@/lib/antinet/api-client";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AzBrowser(props: {
  browse: (letter: string) => Promise<ApiResult<BrowseItem[]>>;
  onOpen: (id: string) => void;
  onError: (m: string) => void;
}) {
  const [items, setItems] = useState<BrowseItem[] | null>(null);

  const pick = async (letter: string) => {
    const r = await props.browse(letter);
    if (r.ok && r.data) setItems(r.data);
    else props.onError(r.error ?? "Browse failed");
  };

  return (
    <div className="group">
      <span>Browse A–Z</span>
      <div className="azbar">
        {LETTERS.map((l) => (
          <button key={l} className="azkey" onClick={() => pick(l)}>
            {l}
          </button>
        ))}
      </div>
      {items &&
        (items.length > 0 ? (
          <div className="chips">
            {items.map((i) => (
              <button key={i._id} className="cardlink" onClick={() => props.onOpen(i._id)}>
                {i.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">No cards for that letter.</p>
        ))}
    </div>
  );
}
