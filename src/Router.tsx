import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewApp from "./NewApp";
import LoginPage from "./LoginPage";
import FirstPage from "./FirstPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/run_demo" element={<NewApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
