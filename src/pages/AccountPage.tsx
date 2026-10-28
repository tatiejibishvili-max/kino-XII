import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { BookingHistory } from "../components/account/BookingHistory";
import { ProfilePanel } from "../components/account/ProfilePanel";
import Footer from "../components/Footer";
import Header from "../components/Header";


export default function AccountPage() {
  const { account, sessionReady, openLogin, logout } = useAuth();
  const signedOut = useRef(false);

  useEffect(() => {
    if (sessionReady && !account && !signedOut.current) openLogin();
  }, [account, openLogin, sessionReady]);

  useEffect(() => {
    const previous = document.title;
    document.title = "Account · KINO XII";
    return () => {
      document.title = previous;
    };
  }, []);

  if (!sessionReady) {
    return (
      <div className="page account-page">
        <Header variant="solid" />
        <main className="account-main" aria-busy="true">
          <p className="sr-only">Loading account</p>
          <div className="skeleton account-skel" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!account) return <Navigate to="/" replace />;

  return (
    <div className="page account-page">
      <Header variant="solid" />
      <main className="account-main">
        <ProfilePanel
          onLogout={() => {
            signedOut.current = true;
            logout();
          }}
        />
        <BookingHistory />
      </main>
      <Footer />
    </div>
  );
}
