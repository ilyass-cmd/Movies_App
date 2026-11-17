import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.text}>
        La page que vous cherchez n’existe pas ou a été déplacée.
      </p>
      <Link href="/" className={styles.link}>
        Retour aux films
      </Link>
    </main>
  );
}
