import Navbar from "@/compenants/navbar/Navbar";
import { FavoritesProvider } from "@/context/FavoritesContext";
import "./globals.css";

export const metadata = {
  title: {
    default: "Cinéma",
    template: "%s | Cinéma",
  },
  description:
    "Parcourez une sélection de films et enregistrez vos favoris directement dans votre navigateur.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <FavoritesProvider>
          <a className="skip-link" href="#contenu">
            Aller au contenu
          </a>
          <Navbar />
          <div id="contenu" tabIndex={-1}>
            {children}
          </div>
        </FavoritesProvider>
      </body>
    </html>
  );
}
