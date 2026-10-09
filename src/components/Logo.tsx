import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link className="logo" to="/">
      <span className="logo-name">KINO</span> <span className="logo-mark">XII</span>
    </Link>
  );
}
