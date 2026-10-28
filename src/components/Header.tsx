import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Button from "./Button";
import { SearchIcon } from "./Icons";
import Logo from "./Logo";

interface HeaderProps {
  variant?: "overlay" | "solid";
}

export default function Header({ variant = "overlay" }: HeaderProps) {
  const { account, openLogin, openRegister } = useAuth();

  return (
    <header className={variant === "solid" ? "header header--solid" : "header"}>
      <div className="header-logo">
        <Logo />
      </div>

      <nav className="nav" aria-label="Primary">
        <NavLink to="/sessions" className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}>
          Sessions
        </NavLink>
      </nav>

      <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
        <SearchIcon />
        <input type="search" placeholder="Search films and live events" aria-label="Search films and live events" />
      </form>

      <div className="header-auth">
        {account ? (
          <Link className="account-link" to="/account" aria-label={`Account, ${account.fullName || account.username}`}>
            {account.avatarUrl ? <img src={account.avatarUrl} alt="" /> : <span>{accountInitials(account.fullName || account.username)}</span>}
            {account.profileComplete === false ? <i className="account-link-dot" /> : null}
          </Link>
        ) : (
          <>
            <Button onClick={openRegister}>Sign up</Button>
            <Button variant="light" onClick={openLogin}>
              Log in
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

function accountInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
