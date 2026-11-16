import { useFavorites } from "../context/FavoritesContext";
import "./MovieCard.css";

function MovieCard({ movie }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(movie.id);
  const year = movie.release_date?.slice(0, 4);

  return (
    <article className="movie-card">
      <div className="movie-poster">
        <img src={movie.url} alt={`Affiche de ${movie.title}`} loading="lazy" />
        <button
          type="button"
          className={`fav-btn ${fav ? "is-active" : ""}`}
          onClick={() => toggleFavorite(movie)}
          aria-pressed={fav}
          aria-label={fav ? `Retirer ${movie.title} des favoris` : `Ajouter ${movie.title} aux favoris`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.9 4.5 6.6 4.5c2 0 3.7 1.1 5.4 3.2 1.7-2.1 3.4-3.2 5.4-3.2 3.7 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z" />
          </svg>
        </button>
      </div>
      <div className="movie-info">
        <h3>{movie.title}</h3>
        {year && <p>{year}</p>}
      </div>
    </article>
  );
}

export default MovieCard;
