import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { SignInPrompt } from "../components/SignInPrompt";

export const Route = createFileRoute("/preferences")({
  component: NotificationPreferencesPage,
});

type Entry = components["schemas"]["NotificationPreferenceEntry"];
type ListResponse = components["schemas"]["NotificationPreferencesResponse"];

const GROUP_ORDER = [
  "Submission",
  "Decisions",
  "Reviews",
] as const;

type GroupName = (typeof GROUP_ORDER)[number];

function groupOf(key: string): GroupName {
  if (key.startsWith("submission.")) return "Submission";
  if (key.startsWith("decision.")) return "Decisions";
  if (key.startsWith("review.")) return "Reviews";
  return "Submission";
}

function NotificationPreferencesPage(): ReactNode {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const reload = async (): Promise<void> => {
    setEntries(null);
    const data = await api<ListResponse>("/api/v1/me/notification-preferences");
    setEntries(data?.entries ?? []);
  };

  useEffect(() => {
    if (user) {
      void reload();
    }
  }, [user]);

  const toggle = async (entry: Entry): Promise<void> => {
    if (!entry.key) return;
    setBusy((b) => ({ ...b, [entry.key as string]: true }));
    const next = !entry.blocked;
    const updated = await api<Entry>(
      `/api/v1/me/notification-preferences/${encodeURIComponent(entry.key)}`,
      { method: "PUT", body: { blocked: next } },
    );
    if (updated) {
      setEntries((prev) =>
        prev
          ? prev.map((e) => (e.key === entry.key ? updated : e))
          : prev,
      );
    }
    setBusy((b) => ({ ...b, [entry.key as string]: false }));
  };

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Email preferences"
        description="Choose which categories of email notifications reach your inbox. Muted categories still appear in the in-app feed below — you just won't get the email."
      />

      <p style={{ marginBottom: 16 }}>
        <Link
          to="/notifications"
          style={{ color: "var(--cobalt)", textDecoration: "none", fontSize: 14 }}
        >
          {"←"} Back to notifications
        </Link>
      </p>

      {entries === null ? (
        <p style={{ color: "var(--muted)" }}>Loading preferences&hellip;</p>
      ) : entries.length === 0 ? (
        <EmptyState
          icon="alert"
          title="No notification categories"
          description="The system has no canonical email-template keys configured. Ask an administrator."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {GROUP_ORDER.map((group) => {
            const inGroup = entries.filter((e) => groupOf(e.key ?? "") === group);
            if (inGroup.length === 0) return null;
            return (
              <Card key={group}>
                <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>
                  {group}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {inGroup.map((entry) => {
                    const k = entry.key ?? "";
                    const isBusy = busy[k] === true;
                    return (
                      <label
                        key={k}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "8px 4px",
                          cursor: "pointer",
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!entry.blocked}
                          disabled={isBusy}
                          onChange={() => void toggle(entry)}
                          style={{ marginTop: 4 }}
                        />
                        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <code style={{ fontSize: 13 }}>{k}</code>
                          {entry.description && (
                            <span style={{ color: "var(--muted)", fontSize: 13 }}>
                              {entry.description}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
