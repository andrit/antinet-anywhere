import { CardLink } from "./atoms";
import type { MainView as MainViewData, BibView as BibViewData, IndexView as IndexViewData } from "@/lib/antinet/api-client";

function Group(props: { label: string; addrs: string[]; onOpen: (a: string) => void }) {
  if (props.addrs.length === 0) return null;
  return (
    <div className="group">
      <span>{props.label}</span>
      <div className="chips">
        {props.addrs.map((a) => (
          <CardLink key={a} address={a} onOpen={props.onOpen} />
        ))}
      </div>
    </div>
  );
}

export function MainView(props: {
  view: MainViewData;
  onOpen: (a: string) => void;
  onOpenBib: (slug: string) => void;
}) {
  const { card, backlinks, children, prev, next } = props.view;
  return (
    <div className="reader">
      <div className="addr">{card._id}</div>
      <h3>{card.title}</h3>
      <p className="body">{card.body}</p>
      <div className="flip">
        {prev && <button className="btn secondary" onClick={() => props.onOpen(prev._id)}>← {prev._id}</button>}
        {next && <button className="btn secondary" onClick={() => props.onOpen(next._id)}>{next._id} →</button>}
      </div>
      <Group label="Children" addrs={children.map((c) => c._id)} onOpen={props.onOpen} />
      <Group label="Links" addrs={card.links} onOpen={props.onOpen} />
      <Group label="Backlinks" addrs={backlinks.map((c) => c._id)} onOpen={props.onOpen} />
      {card.citations.length > 0 && (
        <div className="group">
          <span>Citations</span>
          <div className="chips">
            {card.citations.map((c, i) => (
              <button key={i} className="cardlink" onClick={() => props.onOpenBib(c.bibId)}>
                {c.bibId}
                {c.page ? `, p.${c.page}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BibView(props: { view: BibViewData; onOpen: (a: string) => void }) {
  const { card, citedBy } = props.view;
  return (
    <div className="reader">
      <div className="addr">{card._id}</div>
      <h3>{card.title}</h3>
      <p className="muted">
        {card.authorSort}
        {card.year ? ` · ${card.year}` : ""} · {card.sourceType}
      </p>
      <Group label="Cited by" addrs={citedBy.map((c) => c._id)} onOpen={props.onOpen} />
      {citedBy.length === 0 && <p className="muted">No Main cards cite this yet.</p>}
    </div>
  );
}

export function IndexView(props: { view: IndexViewData; onOpen: (a: string) => void }) {
  const { card, entries } = props.view;
  return (
    <div className="reader">
      <div className="addr">{card._id}</div>
      <h3>{card.displayTerm}</h3>
      <div className="group">
        <span>Entry points</span>
        <div className="chips">
          {entries.map((e) =>
            e.card ? (
              <button key={e.address} className="cardlink" onClick={() => props.onOpen(e.address)}>
                {e.address} — {e.card.title}
              </button>
            ) : (
              <span key={e.address} className="muted">
                {e.address} (missing)
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
