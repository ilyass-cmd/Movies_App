import { useMemo, useState } from "react";
import MovieCard from "../MovieCard/MovieCard";
import { movies } from "../data/movies";
import "./Home.css";

function Home() {
  const [search, setSearch] = useState("");

  const filteredMovies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return movies.filter((movie) => movie.title.toLowerCase().includes(query));
  }, [search]);

  return (
    <main className="Home">
      <h1>Films</h1>

      <form onSubmit={(e) => e.preventDefault()} className="search-form" role="search">
        <input
          type="search"
          placeholder="Rechercher un film..."
          aria-label="Rechercher un film"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="search-btn secondary" onClick={() => setSearch("")}>
            Effacer
          </button>
        )}
      </form>

      <p className="results-count" aria-live="polite">
        {filteredMovies.length} film{filteredMovies.length > 1 ? "s" : ""}
      </p>

      {filteredMovies.length > 0 ? (
        <div className="movies-grid">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <p className="empty">Aucun film ne correspond à « {search.trim()} ».</p>
      )}
    </main>
  );
}

export default Home;
