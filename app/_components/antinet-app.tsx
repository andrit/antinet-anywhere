"use client";
import { useState } from "react";
import { Banner, Field, Button } from "./atoms";
import { MainForm, BibForm, IndexForm } from "./forms";
import { MainView, BibView, IndexView } from "./viewers";
import { BibNotes } from "./bib-notes";
import { AzBrowser } from "./az-browser";
import {
  getMain,
  getBib,
  getIndex,
  deleteMain,
  deleteBib,
  deleteIndex,
  browseBib,
  browseIndex,
  type ApiResult,
  type MainView as MV,
  type BibView as BV,
  type IndexView as IV,
} from "@/lib/antinet/api-client";

function useCircuitNav() {
  const [err, setErr] = useState<string | null>(null);
  const [main, setMain] = useState<MV | null>(null);
  const [bib, setBib] = useState<BV | null>(null);
  const [index, setIndex] = useState<IV | null>(null);

  const open =
    <T,>(fn: (k: string) => Promise<ApiResult<T>>, set: (d: T) => void) =>
    async (key: string) => {
      setErr(null);
      const r = await fn(key);
      if (r.ok && r.data) set(r.data);
      else setErr(r.error ?? "Not found");
    };

  const remove =
    <T,>(fn: (k: string) => Promise<ApiResult<T>>, clear: () => void) =>
    async (key: string) => {
      setErr(null);
      const r = await fn(key);
      if (r.ok) clear();
      else setErr(r.error ?? "Delete failed");
    };

  return {
    err,
    setErr,
    main,
    bib,
    index,
    openMain: open(getMain, setMain),
    openBib: open(getBib, setBib),
    openIndex: open(getIndex, setIndex),
    removeMain: remove(deleteMain, () => setMain(null)),
    removeBib: remove(deleteBib, () => setBib(null)),
    removeIndex: remove(deleteIndex, () => setIndex(null)),
  };
}

function OpenRow(props: { label: string; placeholder: string; onOpen: (k: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form onSubmit={(e) => (e.preventDefault(), v.trim() && props.onOpen(v.trim()))}>
      <Field label={props.label} value={v} onChange={setV} placeholder={props.placeholder} />
      <Button type="submit" variant="secondary">Open</Button>
    </form>
  );
}

export function AntinetApp() {
  const nav = useCircuitNav();
  return (
    <div className="app">
      <header>
        <h1>Antinet</h1>
        <p className="tagline">A Luhmann / Scheper zettelkasten — three boxes, one circuit.</p>
      </header>
      {nav.err && <Banner kind="err">{nav.err}</Banner>}
      <div className="panels">
        <section className="panel">
          <h2>Main Box</h2>
          <MainForm onCreated={nav.openMain} onError={nav.setErr} anchor={nav.main?.card._id} />
          <OpenRow label="Open address" placeholder="3200/4B1" onOpen={nav.openMain} />
          {nav.main && (
            <MainView view={nav.main} onOpen={nav.openMain} onOpenBib={nav.openBib} onDelete={nav.removeMain} />
          )}
        </section>
        <section className="panel">
          <h2>Bib Box</h2>
          <BibForm onCreated={nav.openBib} onError={nav.setErr} />
          <OpenRow label="Open slug" placeholder="kahneman_2011" onOpen={nav.openBib} />
          <AzBrowser browse={browseBib} onOpen={nav.openBib} onError={nav.setErr} />
          {nav.bib && (
            <>
              <BibView view={nav.bib} onOpen={nav.openMain} onDelete={nav.removeBib} />
              <BibNotes bib={nav.bib.card} onOpen={nav.openMain} onError={nav.setErr} onRefresh={nav.openBib} />
            </>
          )}
        </section>
        <section className="panel">
          <h2>Index Box</h2>
          <IndexForm onCreated={nav.openIndex} onError={nav.setErr} />
          <OpenRow label="Open keyword" placeholder="cognitive bias" onOpen={nav.openIndex} />
          <AzBrowser browse={browseIndex} onOpen={nav.openIndex} onError={nav.setErr} />
          {nav.index && <IndexView view={nav.index} onOpen={nav.openMain} onDelete={nav.removeIndex} />}
        </section>
      </div>
    </div>
  );
}
