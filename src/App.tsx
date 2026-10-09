import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import SessionsPage from "./pages/SessionsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
        <Route path="/seats/:sessionId" element={<SeatSelectionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
