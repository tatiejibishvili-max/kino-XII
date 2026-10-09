interface CheckOptionProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  lang?: string;
}

export default function CheckOption({ checked, onChange, label, hint, lang }: CheckOptionProps) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="check-box" aria-hidden="true" />
      <span className="check-copy">
        <span className="check-name" lang={lang}>
          {label}
        </span>
        {hint ? <span className="check-hint">{hint}</span> : null}
      </span>
    </label>
  );
}
