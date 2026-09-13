import { useEffect, useState, type FormEvent } from "react";
import {
  createCheckIn,
  generateInsight,
  getCheckInStats,
  getLatestInsight,
  getMe,
  listCheckIns,
  login,
  logout,
  register,
  type CheckIn,
  type CheckInStats,
  type Insight,
  type User,
} from "./api";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="page">
        <p>Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        error={error}
        onError={setError}
        onAuthed={(next) => {
          setError(null);
          setUser(next);
        }}
      />
    );
  }

  return (
    <CheckInScreen
      user={user}
      error={error}
      onError={setError}
      onLogout={() => {
        setError(null);
        setUser(null);
      }}
    />
  );
}

function AuthScreen({
  error,
  onError,
  onAuthed,
}: {
  error: string | null;
  onError: (message: string | null) => void;
  onAuthed: (user: User) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onError(null);
    setSubmitting(true);

    try {
      const action = mode === "login" ? login : register;
      const data = await action(email, password);
      onAuthed(data.user);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <h1>Recovery Coach</h1>
      <p className="lede">Log a daily check-in. Insights come later.</p>

      <form className="card" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Log in" : "Create an account"}</h2>
        {error ? <p className="error">{error}</p> : null}

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Register"}
        </button>
      </form>

      <button
        className="link"
        type="button"
        onClick={() => {
          onError(null);
          setMode(mode === "login" ? "register" : "login");
        }}
      >
        {mode === "login"
          ? "Need an account? Register"
          : "Already have an account? Log in"}
      </button>
    </main>
  );
}

function CheckInScreen({
  user,
  error,
  onError,
  onLogout,
}: {
  user: User;
  error: string | null;
  onError: (message: string | null) => void;
  onLogout: () => void;
}) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [insightBusy, setInsightBusy] = useState(false);
  const [occurredOn, setOccurredOn] = useState(today);
  const [urgeIntensity, setUrgeIntensity] = useState(3);
  const [actedOnUrge, setActedOnUrge] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const [history, nextStats, latestInsight] = await Promise.all([
      listCheckIns(),
      getCheckInStats(),
      getLatestInsight().catch(() => null),
    ]);
    setCheckIns(history.checkIns);
    setStats(nextStats);
    setInsight(latestInsight);
  }

  useEffect(() => {
    refresh().catch((err) => {
      onError(err instanceof Error ? err.message : "Could not load check-ins");
    });
  }, [onError]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onError(null);
    setSubmitting(true);

    try {
      const created = await createCheckIn({
        occurredOn,
        urgeIntensity,
        actedOnUrge,
        trigger: trigger.trim() || undefined,
        note: note.trim() || undefined,
      });
      setTrigger("");
      setNote("");
      await refresh();
      await requestInsight(created.id);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save check-in");
    } finally {
      setSubmitting(false);
    }
  }

  async function requestInsight(checkInId: string) {
    setInsightBusy(true);
    try {
      const next = await generateInsight(checkInId);
      setInsight(next);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not generate insight");
    } finally {
      setInsightBusy(false);
    }
  }

  async function handleLogout() {
    await logout().catch(() => undefined);
    onLogout();
  }

  return (
    <main className="page">
      <header className="top">
        <div>
          <h1>Daily check-in</h1>
          <p className="lede">{user.email}</p>
        </div>
        <button className="link" type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {stats ? (
        <section className="card stats">
          <div>
            <strong>{stats.checkInStreak}</strong>
            <span>day streak</span>
          </div>
          <div>
            <strong>{stats.totalCheckIns}</strong>
            <span>check-ins</span>
          </div>
          <div>
            <strong>
              {stats.last7AverageUrge === null ? "—" : stats.last7AverageUrge}
            </strong>
            <span>7-day avg urge</span>
          </div>
          <div>
            <strong>
              {stats.last7DidNotAct}/
              {stats.last7ActedOnUrge + stats.last7DidNotAct || 0}
            </strong>
            <span>held back (7d)</span>
          </div>
        </section>
      ) : null}

      <form className="card" onSubmit={handleSubmit}>
        {error ? <p className="error">{error}</p> : null}

        <label>
          Date
          <input
            type="date"
            value={occurredOn}
            onChange={(event) => setOccurredOn(event.target.value)}
            required
          />
        </label>

        <label>
          Urge intensity (0–10): {urgeIntensity}
          <input
            type="range"
            min={0}
            max={10}
            value={urgeIntensity}
            onChange={(event) => setUrgeIntensity(Number(event.target.value))}
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={actedOnUrge}
            onChange={(event) => setActedOnUrge(event.target.checked)}
          />
          I acted on the urge
        </label>

        <label>
          Trigger (optional)
          <input
            value={trigger}
            onChange={(event) => setTrigger(event.target.value)}
            maxLength={200}
          />
        </label>

        <label>
          Note (optional)
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            rows={3}
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save check-in"}
        </button>
      </form>

      <section className="card">
        <h2>Insight</h2>
        {insight ? (
          <>
            <p>
              <strong>Pattern.</strong> {insight.output.pattern}
            </p>
            <p>
              <strong>Try this.</strong> {insight.output.suggestedAction}
            </p>
            <p>
              <strong>Keep going.</strong> {insight.output.encouragement}
            </p>
            <p className="muted">{insight.disclaimer}</p>
          </>
        ) : (
          <p className="muted">Save a check-in to get a short insight.</p>
        )}
        <button
          type="button"
          disabled={insightBusy || checkIns.length === 0}
          onClick={() => {
            const latest = checkIns[0];
            if (latest) {
              void requestInsight(latest.id);
            }
          }}
        >
          {insightBusy ? "Generating…" : "Generate insight"}
        </button>
      </section>

      <section className="card">
        <h2>History</h2>
        {checkIns.length === 0 ? (
          <p className="muted">No check-ins yet.</p>
        ) : (
          <ul className="history">
            {checkIns.map((item) => (
              <li key={item.id}>
                <strong>{item.occurredOn}</strong>
                <span>urge {item.urgeIntensity}/10</span>
                <span>{item.actedOnUrge ? "acted on urge" : "did not act"}</span>
                {item.trigger ? <span>{item.trigger}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
