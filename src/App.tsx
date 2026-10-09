import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import AuthModal from "./components/auth/AuthModal";
import PurchaseModal from "./components/purchase/PurchaseModal";
import PurchaseProvider from "./purchase/PurchaseProvider";
import Home from "./pages/Home";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import SessionsPage from "./pages/SessionsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PurchaseProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
            <Route path="/seats/:sessionId" element={<SeatSelectionPage />} />
          </Routes>
          <AuthModal />
          <PurchaseModal />
        </PurchaseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
