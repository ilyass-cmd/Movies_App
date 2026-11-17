"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/context/FavoritesContext";
import "./Navbar.css";

function Navbar() {
  const { favorites } = useFavorites();
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isFavorites = pathname === "/favorites";
  const count = favorites.length;

  return (
    <header className="navbar">
      <Link href="/" className="navbar-brand">
        Cinéma
      </Link>
      <nav aria-label="Navigation principale">
        <Link
          href="/"
          className={isHome ? "active" : undefined}
          aria-current={isHome ? "page" : undefined}
        >
          Films
        </Link>
        <Link
          href="/favorites"
          className={isFavorites ? "active" : undefined}
          aria-current={isFavorites ? "page" : undefined}
        >
          Favoris
          {count > 0 && (
            <>
              <span className="navbar-count" aria-hidden="true">
                {count}
              </span>
              <span className="sr-only">
                {` ${count} film${count > 1 ? "s" : ""} en favoris`}
              </span>
            </>
          )}
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
