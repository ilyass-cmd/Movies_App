import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FavoritesProvider } from "./compenants/context/FavoritesContext";
import Navbar from "./compenants/Navbar/Navbar";
import Home from "./compenants/Home/Home";
import Favorites from "./compenants/Favorites/Favorites";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <FavoritesProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </FavoritesProvider>
    </BrowserRouter>
  );
}

export default App;
