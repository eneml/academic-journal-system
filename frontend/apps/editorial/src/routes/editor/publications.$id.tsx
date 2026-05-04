import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";

export const Route = createFileRoute("/editor/publications/$id")({
  component: PublicationEditorPage,
});

type Publication = components["schemas"]["PublicationResponse"];
type Galley = components["schemas"]["GalleyResponse"];
type IssueResponse = components["schemas"]["IssueResponse"];
type SectionResponse = components["schemas"]["SectionResponse"];

function PublicationEditorPage(): ReactNode {
  const { id } = useParams({ from: "/editor/publications/$id" });
  const { user, roles, loading: authLoading } = useAuth();
  const publicationId = Number.parseInt(id, 10);
  const [pub, setPub] = useState<Publication | null>(null);
  const [galleys, setGalleys] = useState<Galley[]>([]);
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [sections, setSections] = useState<SectionResponse[]>([]);
  const [errored, setErrored] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const [p, g, i, s] = await Promise.all([
      api<Publication>(`/api/v1/publications/${publicationId}`),
      api<Galley[]>(`/api/v1/publications/${publicationId}/galleys`),
      api<IssueResponse[]>("/api/v1/issues"),
      api<SectionResponse[]>("/api/v1/journal/sections"),
    ]);
    if (!p) {
      setErrored(true);
      return;
    }
    setErrored(false);
    setPub(p);
    setGalleys(g ?? []);
    setIssues(i ?? []);
    setSections(s ?? []);
  }, [publicationId]);

  useEffect(() => {
    if (user && isEditorial(roles) && Number.isFinite(publicationId)) void reload();
  }, [user, roles, publicationId, reload]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title={`Publication #${publicationId}`} />
        <EmptyState icon="alert" title="Editor access required" description="" />
      </>
    );
  }
  if (!Number.isFinite(publicationId)) {
    return <EmptyState icon="alert" title="Invalid id" description="" />;
  }
  if (errored) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title={`Publication #${publicationId}`} />
        <EmptyState icon="alert" title="Publication unavailable" description="" />
      </>
    );
  }
  if (!pub) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading&hellip;</p>;
  }

  const editable = pub.status === "DRAFT";
  const publishable = pub.status === "DRAFT";
  const unpublishable = pub.status === "PUBLISHED" || pub.status === "SCHEDULED";
  const headerTitle =
    pub.title?.en ??
    (pub.title ? Object.values(pub.title)[0] : null) ??
    `Publication #${pub.id}`;

  return (
    <>
      <p style={{ margin: "0 0 6px", fontSize: 12 }}>
        <Link
          to="/editor/submissions/$id"
          params={{ id: String(pub.submissionId ?? "") }}
          className="hover:text-cobalt"
        >
          ← Editorial / submission #{pub.submissionId}
        </Link>
      </p>
      <PageHeader eyebrow="Editorial" title={headerTitle} />
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "baseline",
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <StatusChip status={pub.status} />
        <span className="chip">v{pub.version}</span>
        <StatusChip status={pub.accessStatus} />
        {pub.urlPath ? (
          <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "var(--mono)" }}>
            /articles/{pub.urlPath}
          </span>
        ) : null}
      </div>

      <MetadataEditor
        publication={pub}
        sections={sections}
        issues={issues.filter((i) => !i.published)}
        editable={editable}
        onSaved={() => void reload()}
      />

      <GalleysCard
        publicationId={publicationId}
        galleys={galleys}
        editable={editable}
        onChanged={() => void reload()}
      />

      <DoiCard publication={pub} onChanged={() => void reload()} />

      <PublishCard
        publication={pub}
        publishable={publishable}
        unpublishable={unpublishable}
        onChanged={() => void reload()}
      />
    </>
  );
}

// ---------- Metadata ----------

function MetadataEditor({
  publication,
  sections,
  issues,
  editable,
  onSaved,
}: {
  publication: Publication;
  sections: SectionResponse[];
  issues: IssueResponse[];
  editable: boolean;
  onSaved: () => void;
}): ReactNode {
  const locale = publication.locale ?? "en";
  const [title, setTitle] = useState(publication.title?.[locale] ?? "");
  const [abstractText, setAbstractText] = useState(
    publication.abstractText?.[locale] ?? "",
  );
  const [keywords, setKeywords] = useState((publication.keywords ?? []).join(", "));
  const [disciplines, setDisciplines] = useState(
    (publication.disciplines ?? []).join(", "),
  );
  const [urlPath, setUrlPath] = useState(publication.urlPath ?? "");
  const [licenseUrl, setLicenseUrl] = useState(publication.licenseUrl ?? "");
  const [copyrightHolder, setCopyrightHolder] = useState(
    publication.copyrightHolder ?? "",
  );
  const [copyrightYear, setCopyrightYear] = useState(
    publication.copyrightYear ? String(publication.copyrightYear) : "",
  );
  const [pages, setPages] = useState(publication.pages ?? "");
  const [accessStatus, setAccessStatus] = useState(publication.accessStatus ?? "OPEN");
  const [sectionId, setSectionId] = useState(
    publication.sectionId ? String(publication.sectionId) : "",
  );
  const [issueId, setIssueId] = useState(
    publication.issueId ? String(publication.issueId) : "",
  );
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Re-sync when publication changes upstream.
  useEffect(() => {
    setTitle(publication.title?.[locale] ?? "");
    setAbstractText(publication.abstractText?.[locale] ?? "");
    setKeywords((publication.keywords ?? []).join(", "));
    setDisciplines((publication.disciplines ?? []).join(", "));
    setUrlPath(publication.urlPath ?? "");
    setLicenseUrl(publication.licenseUrl ?? "");
    setCopyrightHolder(publication.copyrightHolder ?? "");
    setCopyrightYear(publication.copyrightYear ? String(publication.copyrightYear) : "");
    setPages(publication.pages ?? "");
    setAccessStatus(publication.accessStatus ?? "OPEN");
    setSectionId(publication.sectionId ? String(publication.sectionId) : "");
    setIssueId(publication.issueId ? String(publication.issueId) : "");
  }, [publication, locale]);

  const save = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    const result = await api<Publication>(`/api/v1/publications/${publication.id}`, {
      method: "PUT",
      body: {
        accessStatus,
        sectionId: Number.parseInt(sectionId, 10) || null,
        issueId: issueId ? Number.parseInt(issueId, 10) : null,
        urlPath: urlPath.trim() || null,
        licenseUrl: licenseUrl.trim() || null,
        copyrightHolder: copyrightHolder.trim() || null,
        copyrightYear: copyrightYear ? Number.parseInt(copyrightYear, 10) : null,
        pages: pages.trim() || null,
        title: { ...(publication.title ?? {}), [locale]: title },
        abstractText: { ...(publication.abstractText ?? {}), [locale]: abstractText },
        keywords: keywords
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        disciplines: disciplines
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        locale,
      },
    });
    setBusy(false);
    if (result) {
      setSavedAt(new Date());
      onSaved();
    }
  };

  if (!editable) {
    return (
      <Card>
        <h2 style={h2Style}>Metadata</h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--fg-2)",
            fontFamily: "var(--serif-body)",
          }}
        >
          This publication is no longer in DRAFT — create a new version to edit metadata.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 style={h2Style}>Metadata (locale: {locale})</h2>
      <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
        <label style={lblStyle}>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={lblStyle}>
          Abstract
          <textarea
            value={abstractText}
            onChange={(e) => setAbstractText(e.target.value)}
            rows={6}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "var(--serif-body)",
              fontSize: 14,
            }}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={lblStyle}>
            Keywords (comma-separated)
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={lblStyle}>
            Disciplines (comma-separated)
            <input
              type="text"
              value={disciplines}
              onChange={(e) => setDisciplines(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <label style={lblStyle}>
            Section
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              style={inputStyle}
            >
              {sections.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.title?.en ?? s.code}
                </option>
              ))}
            </select>
          </label>
          <label style={lblStyle}>
            Issue (optional)
            <select
              value={issueId}
              onChange={(e) => setIssueId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— unassigned —</option>
              {issues.map((i) => (
                <option key={i.id} value={String(i.id)}>
                  {issueLabel(i)}
                </option>
              ))}
            </select>
          </label>
          <label style={lblStyle}>
            Access
            <select
              value={accessStatus}
              onChange={(e) => setAccessStatus(e.target.value as "OPEN" | "RESTRICTED")}
              style={inputStyle}
            >
              <option value="OPEN">Open access</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <label style={lblStyle}>
            URL slug
            <input
              type="text"
              value={urlPath}
              onChange={(e) => setUrlPath(e.target.value)}
              style={inputStyle}
              placeholder="phen-perception-2026"
            />
          </label>
          <label style={lblStyle}>
            Pages (e.g. 12-34)
            <input
              type="text"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={lblStyle}>
            Copyright year
            <input
              type="number"
              value={copyrightYear}
              onChange={(e) => setCopyrightYear(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={lblStyle}>
            Copyright holder
            <input
              type="text"
              value={copyrightHolder}
              onChange={(e) => setCopyrightHolder(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={lblStyle}>
            License URL
            <input
              type="url"
              value={licenseUrl}
              onChange={(e) => setLicenseUrl(e.target.value)}
              style={inputStyle}
              placeholder="https://creativecommons.org/licenses/by/4.0/"
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="submit" disabled={busy} style={btnPrimary}>
            {busy ? "Saving…" : "Save metadata"}
          </button>
          {savedAt ? (
            <span
              style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}
            >
              saved {savedAt.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

// ---------- Galleys ----------

function GalleysCard({
  publicationId,
  galleys,
  editable,
  onChanged,
}: {
  publicationId: number;
  galleys: Galley[];
  editable: boolean;
  onChanged: () => void;
}): ReactNode {
  const [adding, setAdding] = useState(false);

  return (
    <Card padded={false}>
      <div
        style={{
          padding: "16px 22px",
          borderBottom: galleys.length > 0 ? "1px solid var(--border)" : "none",
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Galleys ({galleys.length})</h2>
        {editable ? (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            style={btnSecondary}
          >
            {adding ? "Cancel" : "+ Add galley"}
          </button>
        ) : null}
      </div>
      {adding ? (
        <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--border)" }}>
          <GalleyForm
            publicationId={publicationId}
            initial={null}
            onSaved={() => {
              setAdding(false);
              onChanged();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : null}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {galleys.length === 0 ? (
          <li style={{ padding: "12px 22px 18px", color: "var(--muted)", fontSize: 13 }}>
            No galleys attached. Galleys are public renditions (PDF/HTML/JATS) shown to readers.
          </li>
        ) : (
          galleys
            .slice()
            .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
            .map((g, idx) => (
              <li
                key={g.id}
                style={{
                  padding: "12px 22px",
                  borderBottom:
                    idx < galleys.length - 1 ? "1px solid var(--border)" : "none",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--serif-display)",
                      fontWeight: 600,
                      fontSize: 14,
                      margin: 0,
                    }}
                  >
                    {g.label?.en ?? Object.values(g.label ?? {})[0] ?? `Galley #${g.id}`}{" "}
                    {g.approved ? (
                      <span className="chip chip-cobalt" style={{ marginLeft: 6 }}>
                        approved
                      </span>
                    ) : (
                      <span className="chip" style={{ marginLeft: 6 }}>
                        draft
                      </span>
                    )}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--muted)",
                      margin: "3px 0 0",
                    }}
                  >
                    {g.locale ?? "?"} ·{" "}
                    {g.submissionFileId
                      ? `internal file #${g.submissionFileId}`
                      : g.remoteUrl
                        ? g.remoteUrl
                        : "no source"}
                  </p>
                </div>
                {editable ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const path = g.approved ? "unapprove" : "approve";
                        await api(
                          `/api/v1/publications/${publicationId}/galleys/${g.id}/${path}`,
                          { method: "POST" },
                        );
                        onChanged();
                      }}
                      style={btnSecondary}
                    >
                      {g.approved ? "Unapprove" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Remove galley ${g.id}?`)) return;
                        await api(
                          `/api/v1/publications/${publicationId}/galleys/${g.id}`,
                          { method: "DELETE" },
                        );
                        onChanged();
                      }}
                      style={{
                        ...btnSecondary,
                        color: "#b91c1c",
                        borderColor: "#fca5a5",
                      }}
                    >
                      Remove
                    </button>
                  </>
                ) : null}
              </li>
            ))
        )}
      </ul>
    </Card>
  );
}

function GalleyForm({
  publicationId,
  initial,
  onSaved,
  onCancel,
}: {
  publicationId: number;
  initial: Galley | null;
  onSaved: () => void;
  onCancel: () => void;
}): ReactNode {
  const [label, setLabel] = useState(initial?.label?.en ?? "PDF");
  const [locale, setLocale] = useState(initial?.locale ?? "en");
  const [remoteUrl, setRemoteUrl] = useState(initial?.remoteUrl ?? "");
  const [submissionFileId, setSubmissionFileId] = useState(
    initial?.submissionFileId ? String(initial.submissionFileId) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!remoteUrl.trim() && !submissionFileId.trim()) {
      setError("Either a remote URL or an internal submission file id is required.");
      return;
    }
    setBusy(true);
    setError(null);
    const path = initial
      ? `/api/v1/publications/${publicationId}/galleys/${initial.id}`
      : `/api/v1/publications/${publicationId}/galleys`;
    const result = await api<Galley>(path, {
      method: initial ? "PUT" : "POST",
      body: {
        label: { [locale]: label.trim() },
        locale,
        remoteUrl: remoteUrl.trim() || null,
        submissionFileId: submissionFileId
          ? Number.parseInt(submissionFileId, 10)
          : null,
        seq: initial?.seq ?? 0,
        urlPath: null,
      },
    });
    setBusy(false);
    if (result) onSaved();
    else setError("Save failed.");
  };

  return (
    <form
      onSubmit={submit}
      style={{
        padding: 12,
        border: "1px solid var(--border)",
        borderRadius: "var(--r-2)",
        background: "var(--surface)",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={lblStyle}>
          Label (e.g. PDF, HTML, JATS)
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={inputStyle}
            required
          />
        </label>
        <label style={lblStyle}>
          Locale
          <input
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={inputStyle}
            placeholder="en"
          />
        </label>
      </div>
      <label style={lblStyle}>
        Internal submission file id (optional)
        <input
          type="number"
          value={submissionFileId}
          onChange={(e) => setSubmissionFileId(e.target.value)}
          style={inputStyle}
          placeholder="e.g. 42"
        />
      </label>
      <label style={lblStyle}>
        Remote URL (optional)
        <input
          type="url"
          value={remoteUrl}
          onChange={(e) => setRemoteUrl(e.target.value)}
          style={inputStyle}
          placeholder="https://example.org/galleys/42.pdf"
        />
      </label>
      {error ? (
        <p
          style={{
            margin: 0,
            padding: "8px 10px",
            border: "1px solid #fca5a5",
            background: "#fff5f5",
            color: "#b91c1c",
            borderRadius: "var(--r-1)",
            fontSize: 12,
          }}
        >
          {error}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 6 }}>
        <button type="submit" disabled={busy} style={btnPrimary}>
          {busy ? "Saving…" : initial ? "Save" : "Add galley"}
        </button>
        <button type="button" onClick={onCancel} style={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- DOI ----------

function DoiCard({
  publication,
  onChanged,
}: {
  publication: Publication;
  onChanged: () => void;
}): ReactNode {
  const [doi, setDoi] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDoi = publication.doiId != null;

  if (hasDoi) {
    return (
      <Card>
        <h2 style={h2Style}>DOI</h2>
        <p style={{ margin: 0, fontSize: 13 }}>
          A DOI is registered for this publication (id #{publication.doiId}). Track the
          deposit lifecycle on the{" "}
          <Link
            to="/editor/deposits"
            search={{ publicationId: publication.id ?? 0 }}
            className="text-cobalt"
          >
            deposits page
          </Link>
          .
        </p>
      </Card>
    );
  }

  const assign = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await api(
      `/api/v1/publications/${publication.id}/doi`,
      { method: "POST", body: { doi: doi.trim() } },
    );
    setBusy(false);
    if (result === null) {
      setError("DOI assignment failed. Format: 10.NNNN/something — see CrossRef rules.");
    } else {
      setDoi("");
      onChanged();
    }
  };

  return (
    <Card>
      <h2 style={h2Style}>DOI</h2>
      <form onSubmit={assign} style={{ display: "grid", gap: 8 }}>
        <label style={lblStyle}>
          Assign a DOI to this publication
          <input
            type="text"
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            style={inputStyle}
            placeholder="10.1234/example.42"
            required
            pattern="^10\.[0-9]{4,9}/[-._;()/:A-Za-z0-9]+$"
          />
        </label>
        {error ? (
          <p
            style={{
              margin: 0,
              padding: "8px 10px",
              border: "1px solid #fca5a5",
              background: "#fff5f5",
              color: "#b91c1c",
              borderRadius: "var(--r-1)",
              fontSize: 12,
            }}
          >
            {error}
          </p>
        ) : null}
        <div>
          <button type="submit" disabled={busy} style={btnPrimary}>
            {busy ? "Assigning…" : "Assign DOI"}
          </button>
        </div>
      </form>
    </Card>
  );
}

// ---------- Publish / unpublish ----------

function PublishCard({
  publication,
  publishable,
  unpublishable,
  onChanged,
}: {
  publication: Publication;
  publishable: boolean;
  unpublishable: boolean;
  onChanged: () => void;
}): ReactNode {
  const [busy, setBusy] = useState(false);

  const publish = async (): Promise<void> => {
    if (!confirm(`Publish "${publication.title?.en ?? `#${publication.id}`}" now?`)) return;
    setBusy(true);
    await api(`/api/v1/publications/${publication.id}/publish`, { method: "POST" });
    setBusy(false);
    onChanged();
  };

  const unpublish = async (): Promise<void> => {
    if (!confirm("Unpublish — readers will lose access. Continue?")) return;
    setBusy(true);
    await api(`/api/v1/publications/${publication.id}/unpublish`, { method: "POST" });
    setBusy(false);
    onChanged();
  };

  const newVersion = async (): Promise<void> => {
    setBusy(true);
    const result = await api<Publication>(
      `/api/v1/publications/${publication.id}/versions`,
      { method: "POST" },
    );
    setBusy(false);
    if (result?.id) {
      window.location.assign(`/editor/publications/${result.id}`);
    }
  };

  return (
    <Card>
      <h2 style={h2Style}>Publish</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {publishable ? (
          <button type="button" onClick={publish} disabled={busy} style={btnPrimary}>
            {busy ? "Publishing…" : "Publish now"}
          </button>
        ) : null}
        {unpublishable ? (
          <button
            type="button"
            onClick={unpublish}
            disabled={busy}
            style={{ ...btnSecondary, color: "#b91c1c", borderColor: "#fca5a5" }}
          >
            {busy ? "Working…" : "Unpublish"}
          </button>
        ) : null}
        {publication.status !== "DRAFT" ? (
          <button type="button" onClick={newVersion} disabled={busy} style={btnSecondary}>
            {busy ? "Working…" : "Create new version"}
          </button>
        ) : null}
      </div>
    </Card>
  );
}

// ---------- helpers ----------

function issueLabel(i: IssueResponse): string {
  if (i.title?.en) return i.title.en;
  const parts = [
    i.volume ? `Vol. ${i.volume}` : null,
    i.number ? `No. ${i.number}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `Issue #${i.id}`;
}

const h2Style = {
  margin: "0 0 12px",
  fontFamily: "var(--serif-display)",
  fontWeight: 600,
  fontSize: 18,
};

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
  padding: "9px 16px",
  background: "var(--cobalt)",
  color: "white",
  border: "none",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const btnSecondary = {
  padding: "8px 14px",
  background: "white",
  color: "var(--fg-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 12,
  cursor: "pointer",
};
