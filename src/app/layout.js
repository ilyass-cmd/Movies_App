import { FavoritesProvider } from "@/context/FavoritesContext";
import "./globals.css";

export const metadata = { title: "Cinéma" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <FavoritesProvider>
          <Navbar />
          {children}
        </FavoritesProvider>
      </body>
    </html>
  );
}
