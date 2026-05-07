import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import { Button, Input } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { hasRole } from "../../auth/roles";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

interface JournalConfig {
  name: Record<string, string>;
  issnPrint: string | null;
  issnOnline: string | null;
  defaultLocale: string;
  supportedLocales: string[];
  contactEmail: string | null;
  mastheadText: Record<string, string>;
  copyrightNotice: Record<string, string>;
  licenseUrl: string | null;
  about: Record<string, string>;
  submissionsOpen: boolean;
  version: number;
  updatedAt: string;
}

interface SectionRow {
  id: number;
  code: string;
  title: Record<string, string>;
  abbreviation: string | null;
  reviewFormName: string | null;
  wordCountMax: number | null;
  active: boolean;
}

const TABS = ["Identity", "Sections", "Languages", "Policies", "Submissions"] as const;
type Tab = (typeof TABS)[number];

function SettingsPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!hasRole(roles, "ADMIN")) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Settings" />
        <EmptyState
          icon="alert"
          title="Admin access required"
          description="This area is restricted to ADMIN role holders."
        />
      </>
    );
  }
  return <SettingsAdmin />;
}

function SettingsAdmin(): ReactNode {
  const [config, setConfig] = useState<JournalConfig | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [draft, setDraft] = useState<JournalConfig | null>(null);
  const [tab, setTab] = useState<Tab>("Identity");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const [cfg, secs] = await Promise.all([
        api<JournalConfig>("/api/v1/journal/config"),
        api<SectionRow[]>("/api/v1/journal/sections"),
      ]);
      if (cfg) {
        setConfig(cfg);
        setDraft(cfg);
      }
      if (secs) setSections(secs);
    })();
  }, []);

  const dirty = useMemo(() => {
    if (!config || !draft) return false;
    return JSON.stringify(config) !== JSON.stringify(draft);
  }, [config, draft]);

  async function save(): Promise<void> {
    if (!draft) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: draft.name,
      issnPrint: draft.issnPrint,
      issnOnline: draft.issnOnline,
      defaultLocale: draft.defaultLocale,
      supportedLocales: draft.supportedLocales,
      contactEmail: draft.contactEmail,
      mastheadText: draft.mastheadText,
      copyrightNotice: draft.copyrightNotice,
      licenseUrl: draft.licenseUrl,
      about: draft.about,
      submissionsOpen: draft.submissionsOpen,
    };
    const updated = await api<JournalConfig>("/api/v1/journal/config", {
      method: "PUT",
      body: payload,
    });
    setSaving(false);
    if (updated) {
      setConfig(updated);
      setDraft(updated);
      setSavedAt(Date.now());
    } else {
      setError("Save failed. Check the console for details.");
    }
  }

  if (!draft) return <p className="text-muted">Loading settings…</p>;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Public-facing identity, ISSN, license, supported locales"
        actions={
          <>
            {savedAt ? (
              <span className="text-[11.5px] text-muted self-center">
                Saved {timeAgo(savedAt)}
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={!dirty || saving}
              onClick={() => void save()}
            >
              <Save />
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      />
      {error ? (
        <div className="mb-4 rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-[13px] text-danger-deep">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 md:grid-cols-[180px_1fr]">
        <nav aria-label="Settings sections" className="flex flex-col gap-px">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-left text-[13px] transition-colors",
                tab === t
                  ? "bg-cobalt-soft text-cobalt-deep font-medium"
                  : "text-fg-2 hover:bg-bg-tint hover:text-fg",
              )}
            >
              {t}
            </button>
          ))}
        </nav>
        <div>
          {tab === "Identity" ? (
            <IdentityTab draft={draft} onChange={setDraft} />
          ) : null}
          {tab === "Sections" ? <SectionsTab sections={sections} /> : null}
          {tab === "Languages" ? (
            <LanguagesTab draft={draft} onChange={setDraft} />
          ) : null}
          {tab === "Policies" ? (
            <PoliciesTab draft={draft} onChange={setDraft} />
          ) : null}
          {tab === "Submissions" ? (
            <SubmissionsTab draft={draft} onChange={setDraft} />
          ) : null}
        </div>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------------

function IdentityTab({
  draft,
  onChange,
}: {
  draft: JournalConfig;
  onChange: (next: JournalConfig) => void;
}): ReactNode {
  const set = <K extends keyof JournalConfig>(key: K, value: JournalConfig[K]) =>
    onChange({ ...draft, [key]: value });
  const setName = (loc: string, value: string) =>
    onChange({ ...draft, name: { ...draft.name, [loc]: value } });

  return (
    <Card>
      <h2 className="m-0 mb-1 font-serif-display text-[20px] font-medium">
        Identity
      </h2>
      <p className="mt-0 mb-5 text-[12.5px] text-muted">
        Names, ISSN, default locale, contact email.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {draft.supportedLocales.map((loc) => (
          <Field key={loc} label={`Journal name (${loc.toUpperCase()})`}>
            <Input
              value={draft.name[loc] ?? ""}
              onChange={(e) => setName(loc, e.target.value)}
            />
          </Field>
        ))}
        <Field label="Print ISSN">
          <Input
            value={draft.issnPrint ?? ""}
            onChange={(e) => set("issnPrint", e.target.value || null)}
            placeholder="XXXX-XXXX"
            inputMode="text"
          />
        </Field>
        <Field label="Online ISSN">
          <Input
            value={draft.issnOnline ?? ""}
            onChange={(e) => set("issnOnline", e.target.value || null)}
            placeholder="XXXX-XXXX"
            inputMode="text"
          />
        </Field>
        <Field label="Default locale">
          <select
            value={draft.defaultLocale}
            onChange={(e) => set("defaultLocale", e.target.value)}
            className="flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm font-sans text-fg focus-visible:outline-none focus-visible:border-cobalt"
          >
            {draft.supportedLocales.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contact email">
          <Input
            type="email"
            value={draft.contactEmail ?? ""}
            onChange={(e) => set("contactEmail", e.target.value || null)}
            placeholder="editors@journal.example"
          />
        </Field>
      </div>
    </Card>
  );
}

function SectionsTab({ sections }: { sections: SectionRow[] }): ReactNode {
  if (sections.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="layers"
          title="No sections configured"
          description="Sections are managed via the API. UI surface coming soon."
        />
      </Card>
    );
  }
  return (
    <Card padded={false}>
      <div className="grid grid-cols-[80px_1fr_120px_100px] items-center gap-3 border-b border-border px-5 py-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        <span>Code</span>
        <span>Title</span>
        <span className="text-right">Words max</span>
        <span className="text-right">Status</span>
      </div>
      {sections.map((s) => (
        <div
          key={s.id}
          className="grid grid-cols-[80px_1fr_120px_100px] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
        >
          <span className="font-mono text-[11px] text-muted">{s.code}</span>
          <div>
            <div className="text-[13.5px] font-medium text-fg">
              {pickFirst(s.title) ?? "—"}
            </div>
            {s.reviewFormName ? (
              <div className="text-[11.5px] text-muted">{s.reviewFormName}</div>
            ) : null}
          </div>
          <span className="text-right tabular-nums text-[12px] text-muted">
            {s.wordCountMax?.toLocaleString() ?? "—"}
          </span>
          <span className="text-right text-[11.5px]">
            {s.active ? (
              <span className="rounded-md bg-success-soft px-1.5 py-0.5 font-medium text-success-deep">
                Active
              </span>
            ) : (
              <span className="text-muted">Inactive</span>
            )}
          </span>
        </div>
      ))}
    </Card>
  );
}

function LanguagesTab({
  draft,
  onChange,
}: {
  draft: JournalConfig;
  onChange: (next: JournalConfig) => void;
}): ReactNode {
  const ALL = ["en", "ro", "fr", "de", "es", "it", "pt"];
  const toggle = (loc: string): void => {
    const has = draft.supportedLocales.includes(loc);
    const next = has
      ? draft.supportedLocales.filter((l) => l !== loc)
      : [...draft.supportedLocales, loc];
    if (next.length === 0) return;
    const cleanedName = Object.fromEntries(
      Object.entries(draft.name).filter(([k]) => next.includes(k)),
    );
    onChange({
      ...draft,
      supportedLocales: next,
      name: cleanedName,
      defaultLocale: next.includes(draft.defaultLocale)
        ? draft.defaultLocale
        : next[0]!,
    });
  };
  return (
    <Card>
      <h2 className="m-0 mb-1 font-serif-display text-[20px] font-medium">
        Languages
      </h2>
      <p className="mt-0 mb-5 text-[12.5px] text-muted">
        Toggle which locales the public site exposes. The default locale is set
        in Identity.
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL.map((loc) => {
          const on = draft.supportedLocales.includes(loc);
          return (
            <button
              key={loc}
              type="button"
              onClick={() => toggle(loc)}
              className={cn(
                "rounded-md border px-3 py-1.5 font-mono text-[11.5px] uppercase tracking-wider transition-colors",
                on
                  ? "border-cobalt/30 bg-cobalt-soft text-cobalt-deep"
                  : "border-border bg-white text-muted hover:border-border-strong",
              )}
            >
              {loc}
              {loc === draft.defaultLocale ? (
                <span className="ml-1.5 text-[9px] opacity-70">default</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function PoliciesTab({
  draft,
  onChange,
}: {
  draft: JournalConfig;
  onChange: (next: JournalConfig) => void;
}): ReactNode {
  const set = <K extends keyof JournalConfig>(key: K, value: JournalConfig[K]) =>
    onChange({ ...draft, [key]: value });
  const setNotice = (loc: string, value: string) =>
    onChange({
      ...draft,
      copyrightNotice: { ...draft.copyrightNotice, [loc]: value },
    });
  return (
    <Card>
      <h2 className="m-0 mb-1 font-serif-display text-[20px] font-medium">
        Policies
      </h2>
      <p className="mt-0 mb-5 text-[12.5px] text-muted">
        License URL and per-locale copyright notice shown on the public site.
      </p>
      <div className="grid gap-4">
        <Field label="License URL">
          <Input
            type="url"
            value={draft.licenseUrl ?? ""}
            onChange={(e) => set("licenseUrl", e.target.value || null)}
            placeholder="https://creativecommons.org/licenses/by/4.0/"
          />
        </Field>
        {draft.supportedLocales.map((loc) => (
          <Field key={loc} label={`Copyright notice (${loc.toUpperCase()})`}>
            <textarea
              rows={3}
              value={draft.copyrightNotice[loc] ?? ""}
              onChange={(e) => setNotice(loc, e.target.value)}
              className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-sans text-fg focus-visible:outline-none focus-visible:border-cobalt"
            />
          </Field>
        ))}
      </div>
    </Card>
  );
}

function SubmissionsTab({
  draft,
  onChange,
}: {
  draft: JournalConfig;
  onChange: (next: JournalConfig) => void;
}): ReactNode {
  return (
    <Card>
      <h2 className="m-0 mb-1 font-serif-display text-[20px] font-medium">
        Submissions
      </h2>
      <p className="mt-0 mb-5 text-[12.5px] text-muted">
        Whether new manuscript submissions are accepted right now.
      </p>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={draft.submissionsOpen}
          onChange={(e) =>
            onChange({ ...draft, submissionsOpen: e.target.checked })
          }
          className="mt-1 size-4 rounded border-border accent-cobalt"
        />
        <span>
          <span className="block text-[13px] font-medium text-fg">
            Submissions are open
          </span>
          <span className="block text-[11.5px] text-muted">
            When unchecked, the public Submit form is hidden and the API rejects
            new submissions with a friendly explanation.
          </span>
        </span>
      </label>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function pickFirst(map: Record<string, string>): string | null {
  for (const v of Object.values(map)) {
    if (v?.trim()) return v;
  }
  return null;
}

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}
