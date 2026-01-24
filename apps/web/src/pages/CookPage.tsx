import { useState } from "react";
import { Link } from "react-router-dom";

type MatchRecipe = {
  id: string;
  title: string;
  matchedCount: number;
  requiredCount: number;
  missing: string[];
};

type MatchResponse = {
  cookable: MatchRecipe[];
  almost: MatchRecipe[];
};

export function CookPage() {
  const [input, setInput] = useState("eggs, salt");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onMatch() {
    setError(null);
    setLoading(true);
    try {
      const ingredients = input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("http://localhost:4000/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as MatchResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Failed to match");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/recipes">Recipes</Link>
        <h1 style={{ margin: 0 }}>Cook from pantry</h1>
      </div>

      <p style={{ marginTop: 12 }}>
        Enter ingredients you have (comma-separated). Example: <code>eggs, tomato, salt</code>
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={onMatch} disabled={loading}>
          {loading ? "Matching…" : "Find recipes"}
        </button>
      </div>

      {error && <div style={{ marginTop: 12 }}>{error}</div>}

      {data && (
        <div style={{ marginTop: 18 }}>
          <h2>Can cook now</h2>
          {data.cookable.length === 0 ? (
            <div>No exact matches yet.</div>
          ) : (
            <ul>
              {data.cookable.map((r) => (
                <li key={r.id}>
                  <Link to={`/recipes/${r.id}`}>{r.title}</Link>{" "}
                  <span>
                    ({r.matchedCount}/{r.requiredCount} matched)
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 style={{ marginTop: 16 }}>Almost</h2>
          {data.almost.length === 0 ? (
            <div>Nothing here.</div>
          ) : (
            <ul>
              {data.almost.map((r) => (
                <li key={r.id}>
                  <Link to={`/recipes/${r.id}`}>{r.title}</Link>{" "}
                  <span>
                    — missing: {r.missing.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
