import type { ReactNode } from "react";

export function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <textarea
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

export function Button(props: {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const cls = props.variant === "secondary" ? "btn secondary" : "btn";
  return (
    <button type={props.type ?? "button"} className={cls} disabled={props.disabled} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

export function CardLink(props: { address: string; onOpen: (a: string) => void }) {
  return (
    <button className="cardlink" onClick={() => props.onOpen(props.address)}>
      {props.address}
    </button>
  );
}

export function Banner(props: { kind: "err" | "ok"; children: ReactNode }) {
  return <div className={`banner ${props.kind}`}>{props.children}</div>;
}
