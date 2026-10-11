export default function FilmSkeletons({ label, wide = false }: { label: string; wide?: boolean }) {
  return (
    <div className="home-skeletons" aria-busy="true" aria-live="polite">
      <p className="sr-only">{label}</p>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={wide ? "skeleton home-skel-card home-skel-card--wide" : "skeleton home-skel-card"} />
      ))}
    </div>
  );
}
