import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { loadSessionCatalog } from "../services/sessions";

export default function SeatSelectionPage() {
  const { sessionId } = useParams();
  const [movieId, setMovieId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadSessionCatalog()
      .then((catalog) => {
        if (cancelled) return;
        const session = catalog.sessions.find((item) => item.id === sessionId);
        if (!session) setMissing(true);
        else setMovieId(session.movieId);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (movieId) return <Navigate to={`/movies/${movieId}`} replace />;

  return (
    <div className="page sessions-page">
      <Header variant="solid" />
      <main className="sessions-main">
        {missing ? (
          <div className="empty-sessions">
            <h1>Session unavailable</h1>
            <p>This showtime could not be found.</p>
            <Link className="clear-filters" to="/sessions">
              Back to sessions
            </Link>
          </div>
        ) : (
          <p className="results-count">Loading movie…</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
