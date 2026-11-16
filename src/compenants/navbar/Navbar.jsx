import { Link, NavLink } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import "./Navbar.css";

function Navbar() {
  const { favorites } = useFavorites();

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">Cinéma</Link>
      <nav aria-label="Navigation principale">
        <NavLink to="/" end>Films</NavLink>
        <NavLink to="/favorites">
          Favoris
          {favorites.length > 0 && <span className="navbar-count">{favorites.length}</span>}
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
