"use client";

import Link from "next/link";
import MovieCard from "../cardes/MovieCard";
import { useFavorites } from "@/context/FavoritesContext";
import "./Favorite.css";

function Favorites() {
  const { favorites, clearFavorites } = useFavorites();
  const count = favorites.length;

  return (
    <main className="Favorites">
      <header className="favorites-header">
        <h1>Mes favoris</h1>
        {count > 0 && (
          <button type="button" className="clear-btn" onClick={clearFavorites}>
            Tout supprimer
          </button>
        )}
      </header>

      {count > 0 ? (
        <>
          <p className="favorites-count">
            {count} film{count > 1 ? "s" : ""} enregistré{count > 1 ? "s" : ""}
          </p>
          <div className="favorites-grid">
            {favorites.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </>
      ) : (
        <div className="favorites-empty">
          <p>Vous n’avez encore aucun favori.</p>
          <p>
            Touchez le cœur sur l’affiche d’un film pour le retrouver ici.
          </p>
          <Link href="/" className="favorites-link">
            Parcourir les films
          </Link>
        </div>
      )}
    </main>
  );
}

export default Favorites;
