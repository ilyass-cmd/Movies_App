"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "cinema:favorites";
const EMPTY_FAVORITES = [];

const FavoritesContext = createContext(null);
const listeners = new Set();

// Module-level cache so getSnapshot returns a stable reference between renders.
let cachedFavorites = null;

function normalizeMovie(movie) {
  return {
    id: movie.id,
    title: movie.title,
    release_date: movie.release_date ?? null,
    url: movie.url ?? null,
  };
}

function readStoredFavorites() {
  if (typeof window === "undefined") return EMPTY_FAVORITES;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return EMPTY_FAVORITES;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return EMPTY_FAVORITES;

    const favorites = parsed
      .filter((movie) => movie && movie.id !== undefined && movie.title)
      .map(normalizeMovie);

    return favorites.length > 0 ? favorites : EMPTY_FAVORITES;
  } catch {
    return EMPTY_FAVORITES;
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  if (cachedFavorites === null) {
    cachedFavorites = readStoredFavorites();
  }

  return cachedFavorites;
}

function getServerSnapshot() {
  return EMPTY_FAVORITES;
}

function subscribe(listener) {
  listeners.add(listener);

  const handleStorage = (event) => {
    if (event.key !== STORAGE_KEY) return;

    cachedFavorites = null;
    emitChange();
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function persistFavorites(nextFavorites) {
  cachedFavorites = nextFavorites;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavorites));
  } catch {
    // Storage can be unavailable (private mode, quota); favorites stay in memory.
  }

  emitChange();
}

export function FavoritesProvider({ children }) {
  const favorites = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const isFavorite = useCallback(
    (id) => favorites.some((movie) => movie.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((movie) => {
    if (!movie || movie.id === undefined) return;

    const current = getSnapshot();
    const next = current.some((item) => item.id === movie.id)
      ? current.filter((item) => item.id !== movie.id)
      : [...current, normalizeMovie(movie)];

    persistFavorites(next);
  }, []);

  const clearFavorites = useCallback(() => persistFavorites(EMPTY_FAVORITES), []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, clearFavorites }),
    [favorites, isFavorite, toggleFavorite, clearFavorites],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }

  return context;
}
