import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { SignInPrompt } from "../../components/SignInPrompt";
import { EmptyState } from "../../components/EmptyState";

export const Route = createFileRoute("/author/submissions/new")({
  component: NewSubmissionPage,
});

type SectionResponse = components["schemas"]["SectionResponse"];
type SubmissionResponse = components["schemas"]["SubmissionResponse"];

function NewSubmissionPage(): ReactNode {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionResponse[] | null>(null);
  const [sectionId, setSectionId] = useState<string>("");
  const [locale, setLocale] = useState<string>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const list = await api<SectionResponse[]>("/api/v1/journal/sections");
      if (cancelled) return;
      const active = (list ?? []).filter((s) => !s.inactive);
      setSections(active);
      if (active.length > 0 && active[0]?.id != null) {
        setSectionId(String(active[0].id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const id = Number.parseInt(sectionId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Choose a section");
      return;
    }
    setBusy(true);
    setError(null);
    const created = await api<SubmissionResponse>("/api/v1/submissions", {
      method: "POST",
      body: { sectionId: id, locale },
    });
    setBusy(false);
    if (!created || !created.id) {
      setError("Couldn't start a new submission. Try again or contact the editors.");
      return;
    }
    void navigate({
      to: "/author/submissions/$id",
      params: { id: String(created.id) },
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Author"
        title="Start a new submission"
        description="Pick a section and the manuscript locale. You'll fill in the rest — title, abstract, files, contributors — on the next step."
      />

      {sections == null ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading sections&hellip;</p>
      ) : sections.length === 0 ? (
        <EmptyState
          icon="alert"
          title="No active sections"
          description="An admin needs to create at least one editorial section before authors can submit."
        />
      ) : (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <label style={lblStyle}>
              Section
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                style={inputStyle}
              >
                {sections.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title?.en ??
                      (s.title ? Object.values(s.title)[0] : null) ??
                      s.code}
                  </option>
                ))}
              </select>
            </label>
            <label style={lblStyle}>
              Manuscript language
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                style={inputStyle}
              >
                <option value="en">English</option>
                <option value="ro">Română</option>
              </select>
            </label>
            {error ? (
              <p
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  border: "1px solid #fca5a5",
                  background: "#fff5f5",
                  color: "#b91c1c",
                  borderRadius: "var(--r-2)",
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                }}
              >
                {error}
              </p>
            ) : null}
            <div>
              <button type="submit" disabled={busy} style={btnPrimary}>
                {busy ? "Starting…" : "Start submission"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}

const lblStyle = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  fontFamily: "var(--sans)",
  color: "var(--muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  fontWeight: 600,
};

const inputStyle = {
  padding: "9px 11px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 14,
  background: "white",
  color: "var(--fg)",
  textTransform: "none" as const,
  letterSpacing: 0,
  fontWeight: 400,
};

const btnPrimary = {
  padding: "10px 18px",
  background: "var(--cobalt)",
  color: "white",
  border: "none",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
