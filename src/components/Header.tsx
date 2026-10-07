import Button from "./Button";
import { SearchIcon } from "./Icons";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <Logo />
      </div>

      <nav className="nav" aria-label="Primary">
        <button type="button" className="nav-link">
          Sessions
        </button>
      </nav>

      <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
        <SearchIcon />
        <input type="search" placeholder="Search films and live events" aria-label="Search films and live events" />
      </form>

      <div className="header-auth">
        <Button>Sign up</Button>
        <Button variant="light">Log in</Button>
      </div>
    </header>
  );
}
