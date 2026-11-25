"use client";
import { useState } from "react";
import { Field, TextField, Button } from "./atoms";
import { createCard, suggestAddress } from "@/lib/antinet/api-client";

interface FormProps {
  onCreated: (id: string) => void;
  onError: (msg: string) => void;
}

function idOf(data: unknown): string {
  return (data as { _id: string })._id;
}

function AddressSuggest(props: { anchor: string; onPick: (a: string) => void; onError: (m: string) => void }) {
  const pick = async (kind: "child" | "sibling") => {
    const r = await suggestAddress(props.anchor);
    if (!r.ok || !r.data) {
      props.onError(r.error ?? "Suggest failed");
      return;
    }
    const next = kind === "child" ? r.data.child : r.data.sibling;
    if (next) props.onPick(next);
    else props.onError("A section has no computed sibling — choose the next section yourself");
  };
  return (
    <div className="chips">
      <Button variant="secondary" onClick={() => void pick("child")}>+ Child of {props.anchor}</Button>
      <Button variant="secondary" onClick={() => void pick("sibling")}>+ Sibling of {props.anchor}</Button>
    </div>
  );
}

export function MainForm({ onCreated, onError, anchor }: FormProps & { anchor?: string }) {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [links, setLinks] = useState("");
  const [bibId, setBibId] = useState("");
  const [page, setPage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const r = await createCard("main", {
      _id: id,
      title,
      body,
      links: links.split(",").map((s) => s.trim()).filter(Boolean),
      citations: bibId ? [{ bibId, page: page || undefined }] : [],
    });
    setBusy(false);
    if (r.ok && r.data) {
      onCreated(idOf(r.data));
      setId(""), setTitle(""), setBody(""), setLinks(""), setBibId(""), setPage("");
    } else onError(r.error ?? "Create failed");
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      {anchor && <AddressSuggest anchor={anchor} onPick={setId} onError={onError} />}
      <Field label="Address (e.g. 3200/4B1)" value={id} onChange={setId} />
      <Field label="Title" value={title} onChange={setTitle} />
      <TextField label="Body (≤600 chars)" value={body} onChange={setBody} />
      <Field label="Links — comma-separated addresses" value={links} onChange={setLinks} />
      <Field label="Cite bibId (optional)" value={bibId} onChange={setBibId} />
      <Field label="Cite page (optional)" value={page} onChange={setPage} />
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create Main card"}</Button>
    </form>
  );
}

export function BibForm({ onCreated, onError }: FormProps) {
  const [id, setId] = useState("");
  const [authorSort, setAuthorSort] = useState("");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const r = await createCard("bib", {
      _id: id,
      authorSort,
      title,
      year: year ? Number(year) : undefined,
      sourceType: sourceType || undefined,
    });
    setBusy(false);
    if (r.ok && r.data) {
      onCreated(idOf(r.data));
      setId(""), setAuthorSort(""), setTitle(""), setYear(""), setSourceType("");
    } else onError(r.error ?? "Create failed");
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      <Field label="Slug (e.g. kahneman_2011)" value={id} onChange={setId} />
      <Field label="Author sort (Last, First)" value={authorSort} onChange={setAuthorSort} />
      <Field label="Title" value={title} onChange={setTitle} />
      <Field label="Year (optional)" value={year} onChange={setYear} />
      <Field label="Source type — book|article|video|podcast|other" value={sourceType} onChange={setSourceType} />
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create Bib card"}</Button>
    </form>
  );
}

export function IndexForm({ onCreated, onError }: FormProps) {
  const [id, setId] = useState("");
  const [displayTerm, setDisplayTerm] = useState("");
  const [entryPoints, setEntryPoints] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const r = await createCard("index", {
      _id: id,
      displayTerm,
      entryPoints: entryPoints.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setBusy(false);
    if (r.ok && r.data) {
      onCreated(idOf(r.data));
      setId(""), setDisplayTerm(""), setEntryPoints("");
    } else onError(r.error ?? "Create failed");
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      <Field label="Keyword (e.g. cognitive bias)" value={id} onChange={setId} />
      <Field label="Display term" value={displayTerm} onChange={setDisplayTerm} />
      <Field label="Entry points — 1–4 comma-separated addresses" value={entryPoints} onChange={setEntryPoints} />
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create Index card"}</Button>
    </form>
  );
}
