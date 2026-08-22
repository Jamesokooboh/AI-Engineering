import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>AI Mentorship Platform</h1>
        <p>Book and manage 1-on-1 mentorship sessions.</p>
      </main>
    </div>
  );
}
