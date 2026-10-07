import type { ReactNode } from "react";

interface MovieRowProps {
  title: string;
  id: string;
  children: ReactNode;
}

export default function MovieRow({ title, id, children }: MovieRowProps) {
  return (
    <section className="section" aria-labelledby={id}>
      <div className="section-head">
        <h2 id={id}>{title}</h2>
        <button type="button" className="see-all">
          See all
        </button>
      </div>
      <div className="movie-row">{children}</div>
    </section>
  );
}
