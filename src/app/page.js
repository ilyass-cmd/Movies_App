"use client";
import { useState, useEffect } from "react";
import TacheItem from "@/compenants/Tache/TacheItem";
function App() {
  // Charge les tâches sauvegardées (ou une liste vide)
  const [taches, setTaches] = useState(() => {
    const sauvegarde = localStorage.getItem("taches");
    return sauvegarde ? JSON.parse(sauvegarde) : [];
  });
  const [texte, setTexte] = useState("");
  const [filtre, setFiltre] = useState("toutes");
  // Sauvegarde à chaque changement de la liste
  useEffect(() => {
    localStorage.setItem("taches", JSON.stringify(taches));
  }, [taches]);
  function ajouter(e) {
    e.preventDefault();
    if (texte.trim() === "") return;
    setTaches([
      ...taches,
      { id: Date.now(), texte: texte.trim(), faite: false },
    ]);
    setTexte("");
  }
  function basculer(id) {
    setTaches(taches.map((t) => (t.id === id ? { ...t, faite: !t.faite } : t)));
  }
  function supprimer(id) {
    setTaches(taches.filter((t) => t.id !== id));
  }
  const tachesAffichees = taches.filter((t) => {
    if (filtre === "actives") return !t.faite;
    if (filtre === "terminees") return t.faite;
    return true;
  });
  const restantes = taches.filter((t) => !t.faite).length;
  return (
    <div className="app">
      <h1>Mes tâches</h1>
      <form onSubmit={ajouter}>
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Nouvelle tâche..."
        />
        <button type="submit">Ajouter</button>
      </form>
      <div className="filtres">
        <button onClick={() => setFiltre("toutes")}>Toutes</button>
        <button onClick={() => setFiltre("actives")}>Actives</button>
        <button onClick={() => setFiltre("terminees")}>Terminées</button>
      </div>
      {tachesAffichees.length === 0 ? (
        <p>Aucune tâche à afficher.</p>
      ) : (
        <ul>
          {tachesAffichees.map((t) => (
            <TacheItem
              key={t.id}
              tache={t}
              onBasculer={basculer}
              onSupprimer={supprimer}
            />
          ))}
        </ul>
      )}
      <p>{restantes} tâche(s) restante(s)</p>
    </div>
  );
}
export default App;
