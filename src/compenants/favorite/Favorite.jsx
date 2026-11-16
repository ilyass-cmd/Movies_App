import { Link } from "react-router-dom";
import MovieCard from "../MovieCard/MovieCard";
import { useFavorites } from "../context/FavoritesContext";
import "./Favorites.css";

function Favorites() {
  const { favorites, clearFavorites } = useFavorites();

  return (
    <main className="Favorites">
      <header className="favorites-header">
        <h1>Mes favoris</h1>
        {favorites.length > 0 && (
          <button type="button" className="clear-btn" onClick={clearFavorites}>
            Tout supprimer
          </button>
        )}
      </header>

      {favorites.length > 0 ? (
        <>
          <p className="favorites-count">
            {favorites.length} film{favorites.length > 1 ? "s" : ""} enregistré{favorites.length > 1 ? "s" : ""}
          </p>
          <div className="favorites-grid">
            {favorites.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </>
      ) : (
        <div className="favorites-empty">
          <p>Vous n'avez encore aucun favori.</p>
          <p>Touchez le cœur sur l'affiche d'un film pour le retrouver ici.</p>
          <Link to="/" className="favorites-link">Parcourir les films</Link>
        </div>
      )}
    </main>
  );
}

export default Favorites;
