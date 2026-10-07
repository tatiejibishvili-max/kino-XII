interface AgeBadgeProps {
  rating: string;
}

function badgeTone(rating: string) {
  if (rating.startsWith("12")) return "green";
  if (rating.startsWith("16")) return "orange";
  return "red";
}

export default function AgeBadge({ rating }: AgeBadgeProps) {
  return <span className={`age-badge age-badge--${badgeTone(rating)}`}>{rating}</span>;
}
