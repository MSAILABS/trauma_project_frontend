import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from './Index.tsx'
import NewApp from "./NewApp";
import LoginPage from "./LoginPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/run_demo" element={<NewApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
