interface AgeBadgeProps {
  rating: string;
  tone?: "red" | "green" | "orange";
}

function badgeTone(rating: string) {
  if (rating.startsWith("12")) return "green";
  if (rating.startsWith("16")) return "orange";
  return "red";
}

export default function AgeBadge({ rating, tone }: AgeBadgeProps) {
  return <span className={`age-badge age-badge--${tone ?? badgeTone(rating)}`}>{rating}</span>;
}
