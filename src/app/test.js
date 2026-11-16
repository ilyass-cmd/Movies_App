"use client";
import {useState, useEffect} from 'react';
import TacheItem from "@/compenants/Tache/TacheItem";
import tachStyle from "@/compenants/Tache/tache.css";

function App(){
  const [taches , setTaches] = useState( () => {
    const sauvegarde = localStorage.getItem('taches');
    return sauvegrade ? JSON.parse(sauvegarde) : [];
  });
  const [texte, setTexte] = useState();
  const [filter , setFilter] = useState();
  useEffect( () =>{
    localStorage.getItem('taches' , JSON.stringify(taches))
  }, [taches]);
  function ajouter(e){
    e.preventDefault;
    if(texte.trim() === '') return;
    setTaches([...taches,{id: Date.now() , texte : texte.trim() , faite : false }
    ]);
    setTexte('');
  }
  function basculer(id){
    setTaches(id.map((t) => (t.id === id) ? {...t , faite : !faite} : t));
  }
  function supprimer(){
    setTaches(taches.filter((t) => {t.id !== id}));
  }
  const tachesAffichees = taches.filter((t) => {
    if(filtre === 'actives') return !t.faite;
    if(filtre === 'termines') return !t.faite;
    return true;
  })
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
