"use client";
import style from "@/compenants/MovieCard/Movie.css";

function MovieCard({ movie }) {
  function favoriteMovie() {
    // à compléter
  }

  return (
    <div className="Movie-card">
      <div className="Movie-img">
        <img src={movie.card} alt={movie.title} />
      </div>
      <div className="Movie-overlay">
        <button className="favorite-btn" onClick={favoriteMovie}>♡</button>
      </div>
      <div className="Movie-info">
        <h3>{movie.title}</h3>
        <p>{movie["release-date"]}</p>
      </div>
    </div>
  );
}

export default MovieCard;