"use client";
import { useState } from "react";
import { Field, TextField, Button, CardLink } from "./atoms";
import { addReadingNote, promoteNote } from "@/lib/antinet/api-client";
import type { BibCard, ReadingNote } from "@/lib/antinet/bib-card";

interface Shared {
  onOpen: (a: string) => void;
  onError: (m: string) => void;
}

function PromoteForm(props: Shared & { slug: string; noteIndex: number; onDone: () => void }) {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const r = await promoteNote(props.slug, { noteIndex: props.noteIndex, main: { _id: id, title, body } });
    setBusy(false);
    if (r.ok && r.data) {
      props.onOpen(r.data.main._id);
      props.onDone();
    } else props.onError(r.error ?? "Promote failed");
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      <Field label="New address" value={id} onChange={setId} />
      <Field label="Title" value={title} onChange={setTitle} />
      <TextField label="Atomic idea (body)" value={body} onChange={setBody} />
      <Button type="submit" disabled={busy}>{busy ? "Promoting…" : "Create Main card from note"}</Button>
    </form>
  );
}

function NoteRow(props: Shared & { note: ReadingNote; index: number; slug: string; onRefresh: () => void }) {
  const [promoting, setPromoting] = useState(false);
  const { note } = props;
  return (
    <div className="note">
      <span className="muted">p.{note.page}</span> {note.note}{" "}
      {note.processedToMainId ? (
        <CardLink address={note.processedToMainId} onOpen={props.onOpen} />
      ) : (
        <button className="btn secondary" onClick={() => setPromoting(true)}>Promote</button>
      )}
      {promoting && !note.processedToMainId && (
        <PromoteForm
          slug={props.slug}
          noteIndex={props.index}
          onOpen={props.onOpen}
          onError={props.onError}
          onDone={() => (setPromoting(false), props.onRefresh())}
        />
      )}
    </div>
  );
}

export function BibNotes(props: Shared & { bib: BibCard; onRefresh: (slug: string) => void }) {
  const [page, setPage] = useState("");
  const [text, setText] = useState("");

  const add = async () => {
    const r = await addReadingNote(props.bib._id, { page, note: text });
    if (r.ok) {
      setPage(""), setText(""), props.onRefresh(props.bib._id);
    } else props.onError(r.error ?? "Add failed");
  };

  return (
    <div className="group">
      <span>Reading notes</span>
      {props.bib.readingNotes.map((n, i) => (
        <NoteRow
          key={i}
          note={n}
          index={i}
          slug={props.bib._id}
          onOpen={props.onOpen}
          onError={props.onError}
          onRefresh={() => props.onRefresh(props.bib._id)}
        />
      ))}
      {props.bib.readingNotes.length === 0 && <p className="muted">No reading notes yet.</p>}
      <form onSubmit={(e) => (e.preventDefault(), void add())}>
        <Field label="Note page" value={page} onChange={setPage} />
        <Field label="Note text" value={text} onChange={setText} />
        <Button type="submit" variant="secondary">Add note</Button>
      </form>
    </div>
  );
}
