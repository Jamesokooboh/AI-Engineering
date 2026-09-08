"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./page.module.css";

type Mentor = { id: string; name: string; bio: string };

const UNREACHABLE = "Couldn't reach the server — is the backend running?";

export default function Home() {
  const [mentors, setMentors] = useState<Mentor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mentors");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? UNREACHABLE);
          return;
        }
        setMentors(data.mentors);
      } catch {
        if (!cancelled) setError(UNREACHABLE);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? UNREACHABLE);
        return;
      }
      setMentors((prev) => [...(prev ?? []), data.mentor]);
      setName("");
      setBio("");
    } catch {
      setError(UNREACHABLE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>AI Mentorship Platform</h1>
        <p>Book and manage 1-on-1 mentorship sessions.</p>

        {error && <p role="alert">{error}</p>}

        {mentors === null && !error && <p>Loading…</p>}
        {mentors !== null && mentors.length === 0 && <p>No mentors yet</p>}
        {mentors !== null && mentors.length > 0 && (
          <ul>
            {mentors.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong>: {m.bio}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
          <input
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
            required
          />
          <button type="submit" disabled={submitting}>
            Add mentor
          </button>
        </form>
      </main>
    </div>
  );
}
