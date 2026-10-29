function TacheItem({ tache, onBasculer, onSupprimer }) {
  return (
    <li className={tache.faite ? "tache faite" : "tache"}>
      <input
        type="checkbox"
        checked={tache.faite}
        onChange={() => onBasculer(tache.id)}
      />
      <span>{tache.texte} test</span>
      <button onClick={() => onSupprimer(tache.id)}>🗑</button>
    </li>
  );
}
export default TacheItem;
