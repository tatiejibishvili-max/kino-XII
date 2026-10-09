import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import SessionsPage from "./pages/SessionsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sessions" element={<SessionsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
