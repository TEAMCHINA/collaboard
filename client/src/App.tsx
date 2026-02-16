import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { BoardPage } from "./pages/BoardPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/:token" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
