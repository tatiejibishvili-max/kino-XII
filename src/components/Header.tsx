import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Button from "./Button";
import { SearchIcon } from "./Icons";
import Logo from "./Logo";

interface HeaderProps {
  variant?: "overlay" | "solid";
}

export default function Header({ variant = "overlay" }: HeaderProps) {
  const { account, openLogin, openRegister, logout } = useAuth();

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
          <>
            <span className="header-user">{account.username}</span>
            <Button variant="light" onClick={logout}>
              Log out
            </Button>
          </>
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
