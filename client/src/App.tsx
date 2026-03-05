import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { BoardPage } from "./pages/BoardPage";
import { ErrorToast } from "./components/ErrorToast/ErrorToast";

export function App() {
  return (
    <>
      <ErrorToast />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/:token" element={<BoardPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
