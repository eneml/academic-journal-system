import {
  createFileRoute,
  Link,
  useParams,
} from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import { getUserManager } from "../../auth/oidc";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";

export const Route = createFileRoute("/author/submissions/$id")({
  component: SubmissionDetailPage,
});

type Submission = components["schemas"]["SubmissionResponse"];
type AuthorRow = components["schemas"]["SubmissionAuthorResponse"];
type FileRow = components["schemas"]["SubmissionFileResponse"];
type GenreResponse = components["schemas"]["GenreResponse"];

const FILE_STAGES = [
  "MANUSCRIPT",
  "SUPPLEMENTARY",
  "REVISION",
  "COPYEDITED",
  "PROOF",
] as const;
type FileStage = (typeof FILE_STAGES)[number];

function SubmissionDetailPage(): ReactNode {
  const { id } = useParams({ from: "/author/submissions/$id" });
  const { user, loading: authLoading } = useAuth();
  const submissionId = Number.parseInt(id, 10);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [authors, setAuthors] = useState<AuthorRow[] | null>(null);
  const [files, setFiles] = useState<FileRow[] | null>(null);
  const [genres, setGenres] = useState<GenreResponse[] | null>(null);
  const [errored, setErrored] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const [s, a, f, g] = await Promise.all([
      api<Submission>(`/api/v1/submissions/${submissionId}`),
      api<AuthorRow[]>(`/api/v1/submissions/${submissionId}/authors`),
      api<FileRow[]>(`/api/v1/submissions/${submissionId}/files`),
      api<GenreResponse[]>("/api/v1/journal/genres"),
    ]);
    if (s == null) {
      setErrored(true);
      return;
    }
    setErrored(false);
    setSubmission(s);
    setAuthors(a ?? []);
    setFiles(f ?? []);
    setGenres((g ?? []).filter((x) => x.enabled !== false));
  }, [submissionId]);

  useEffect(() => {
    if (user && Number.isFinite(submissionId)) void reload();
  }, [user, submissionId, reload]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!Number.isFinite(submissionId)) {
    return (
      <EmptyState icon="alert" title="Invalid submission id" description="" />
    );
  }
  if (errored) {
    return (
      <>
        <PageHeader eyebrow="Author" title={`Submission #${submissionId}`} />
        <EmptyState
          icon="alert"
          title="Submission unavailable"
          description="It may not exist, or you don't have access to it."
        />
      </>
    );
  }
  if (!submission) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading&hellip;</p>;
  }

  const editable = submission.status === "DRAFT";
  const submittable = editable;

  const headerTitle =
    submission.title?.en ??
    (submission.title ? Object.values(submission.title)[0] : null) ??
    `Submission #${submission.id}`;

  return (
    <>
      <p style={{ margin: "0 0 6px", fontSize: 12 }}>
        <Link to="/author/submissions" className="hover:text-cobalt">
          ← Author / submissions
        </Link>
      </p>
      <PageHeader eyebrow="Submission" title={headerTitle} />
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "baseline",
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <StatusChip status={submission.status} />
        <StatusChip status={submission.stage} />
        <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "var(--mono)" }}>
          v{submission.version ?? 0} · last activity{" "}
          {submission.dateLastActivity
            ? new Date(submission.dateLastActivity).toLocaleString()
            : "—"}
        </span>
      </div>

      <MetadataCard
        submission={submission}
        editable={editable}
        onSaved={() => void reload()}
      />

      <AuthorsCard
        submissionId={submissionId}
        authors={authors ?? []}
        editable={editable}
        onChange={() => void reload()}
      />

      <FilesCard
        submissionId={submissionId}
        files={files ?? []}
        genres={genres ?? []}
        editable={editable}
        onChange={() => void reload()}
      />

      {submittable ? (
        <SubmitCard
          submissionId={submissionId}
          authors={authors ?? []}
          files={files ?? []}
          onSubmitted={() => void reload()}
        />
      ) : (
        <Card>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--serif-body)",
              fontSize: 14,
              color: "var(--fg-2)",
            }}
          >
            This submission is in editorial workflow. You'll be notified when
            the editors take action; revisions appear here when requested.
          </p>
        </Card>
      )}
    </>
  );
}

// ---------- Metadata ----------

function MetadataCard({
  submission,
  editable,
  onSaved,
}: {
  submission: Submission;
  editable: boolean;
  onSaved: () => void;
}): ReactNode {
  const locale = submission.locale ?? "en";
  const [title, setTitle] = useState(submission.title?.[locale] ?? "");
  const [abstractText, setAbstractText] = useState(
    submission.abstractText?.[locale] ?? "",
  );
  const [keywords, setKeywords] = useState(
    (submission.keywords ?? []).join(", "),
  );
  const [comments, setComments] = useState(submission.commentsToEditor ?? "");
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Re-sync when the submission changes upstream.
  useEffect(() => {
    setTitle(submission.title?.[locale] ?? "");
    setAbstractText(submission.abstractText?.[locale] ?? "");
    setKeywords((submission.keywords ?? []).join(", "));
    setComments(submission.commentsToEditor ?? "");
  }, [submission, locale]);

  const save = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    const kw = keywords
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // Merge with existing translations so other locales aren't wiped.
    const mergedTitle = { ...(submission.title ?? {}), [locale]: title };
    const mergedAbstract = {
      ...(submission.abstractText ?? {}),
      [locale]: abstractText,
    };
    const result = await api<Submission>(
      `/api/v1/submissions/${submission.id}/details`,
      {
        method: "PUT",
        body: {
          title: mergedTitle,
          abstractText: mergedAbstract,
          keywords: kw,
          disciplines: submission.disciplines ?? [],
          referencesRaw: submission.referencesRaw ?? "",
          commentsToEditor: comments,
          progress: progressFor(title, abstractText, kw),
        },
      },
    );
    setBusy(false);
    if (result) {
      setSavedAt(new Date());
      onSaved();
    }
  };

  return (
    <Card>
      <SectionTitle>Manuscript metadata</SectionTitle>
      {!editable ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Title">{title || "—"}</Field>
          <Field label="Abstract">
            <span style={{ whiteSpace: "pre-wrap" }}>{abstractText || "—"}</span>
          </Field>
          <Field label="Keywords">{keywords || "—"}</Field>
          {comments ? <Field label="Comments to editor">{comments}</Field> : null}
        </div>
      ) : (
        <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
          <label style={lblStyle}>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              maxLength={1024}
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
                fontSize: 15,
              }}
            />
          </label>
          <label style={lblStyle}>
            Keywords (comma-separated)
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              style={inputStyle}
              placeholder="phenomenology, perception, kant"
            />
          </label>
          <label style={lblStyle}>
            Comments to editor (optional)
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "var(--serif-body)",
                fontSize: 14,
              }}
            />
          </label>
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
      )}
    </Card>
  );
}

function progressFor(title: string, abstractText: string, keywords: string[]): string {
  const hasTitle = title.trim().length > 0;
  const hasAbstract = abstractText.trim().length >= 80;
  const hasKeywords = keywords.length >= 2;
  if (hasTitle && hasAbstract && hasKeywords) return "READY_FOR_REVIEW";
  if (hasTitle || hasAbstract || hasKeywords) return "DETAILS_IN_PROGRESS";
  return "STARTED";
}

// ---------- Authors ----------

function AuthorsCard({
  submissionId,
  authors,
  editable,
  onChange,
}: {
  submissionId: number;
  authors: AuthorRow[];
  editable: boolean;
  onChange: () => void;
}): ReactNode {
  const [adding, setAdding] = useState(false);

  return (
    <Card padded={false}>
      <div style={{ padding: "16px 22px 0", display: "flex", gap: 8 }}>
        <SectionTitle style={{ marginBottom: 0, flex: 1 }}>
          Contributors
        </SectionTitle>
        {editable ? (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            style={btnSecondary}
          >
            {adding ? "Cancel" : "+ Add author"}
          </button>
        ) : null}
      </div>
      {adding ? (
        <div style={{ padding: "12px 22px 16px", borderBottom: "1px solid var(--border)" }}>
          <AuthorForm
            submissionId={submissionId}
            initial={null}
            onSaved={() => {
              setAdding(false);
              onChange();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : null}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {authors.length === 0 ? (
          <li style={{ padding: "16px 22px", color: "var(--muted)", fontSize: 13 }}>
            No contributors yet — add at least one before submitting.
          </li>
        ) : (
          authors
            .slice()
            .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
            .map((author, idx) => (
              <li
                key={author.id}
                style={{
                  padding: "14px 22px",
                  borderBottom:
                    idx < authors.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <AuthorRowView
                  author={author}
                  submissionId={submissionId}
                  editable={editable}
                  onChange={onChange}
                />
              </li>
            ))
        )}
      </ul>
    </Card>
  );
}

function AuthorRowView({
  author,
  submissionId,
  editable,
  onChange,
}: {
  author: AuthorRow;
  submissionId: number;
  editable: boolean;
  onChange: () => void;
}): ReactNode {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <AuthorForm
        submissionId={submissionId}
        initial={author}
        onSaved={() => {
          setEditing(false);
          onChange();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--serif-display)",
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {[author.givenName, author.familyName].filter(Boolean).join(" ") || "Unnamed"}
        </p>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--muted)",
            margin: "3px 0 0",
          }}
        >
          {author.email ?? "—"}
          {author.orcidId ? ` · ORCID ${author.orcidId}` : ""}
        </p>
        {author.affiliation ? (
          <p style={{ fontSize: 13, color: "var(--fg-2)", margin: "4px 0 0" }}>
            {author.affiliation}
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {author.corresponding ? (
            <span className="chip chip-cobalt">corresponding</span>
          ) : null}
          {author.includeInBrowse ? null : (
            <span className="chip">hidden in browse</span>
          )}
        </div>
      </div>
      {editable ? (
        <div style={{ display: "flex", gap: 6, flex: "none" }}>
          <button type="button" onClick={() => setEditing(true)} style={btnSecondary}>
            Edit
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`Remove ${author.givenName ?? "author"}?`)) return;
              await api(`/api/v1/submissions/${submissionId}/authors/${author.id}`, {
                method: "DELETE",
              });
              onChange();
            }}
            style={{ ...btnSecondary, color: "#b91c1c", borderColor: "#fca5a5" }}
          >
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AuthorForm({
  submissionId,
  initial,
  onSaved,
  onCancel,
}: {
  submissionId: number;
  initial: AuthorRow | null;
  onSaved: () => void;
  onCancel: () => void;
}): ReactNode {
  const [givenName, setGivenName] = useState(initial?.givenName ?? "");
  const [familyName, setFamilyName] = useState(initial?.familyName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [orcidId, setOrcidId] = useState(initial?.orcidId ?? "");
  const [affiliation, setAffiliation] = useState(initial?.affiliation ?? "");
  const [corresponding, setCorresponding] = useState(initial?.corresponding ?? false);
  const [includeInBrowse, setIncludeInBrowse] = useState(initial?.includeInBrowse ?? true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    const path = initial
      ? `/api/v1/submissions/${submissionId}/authors/${initial.id}`
      : `/api/v1/submissions/${submissionId}/authors`;
    const result = await api<AuthorRow>(path, {
      method: initial ? "PUT" : "POST",
      body: {
        givenName: givenName.trim(),
        familyName: familyName.trim() || null,
        email: email.trim(),
        orcidId: orcidId.trim() || null,
        affiliation: affiliation.trim() || null,
        biography: {},
        corresponding,
        includeInBrowse,
      },
    });
    setBusy(false);
    if (result) onSaved();
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={lblStyle}>
          Given name
          <input
            required
            value={givenName}
            onChange={(e) => setGivenName(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={lblStyle}>
          Family name
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>
      <label style={lblStyle}>
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={lblStyle}>
          ORCID iD (optional)
          <input
            value={orcidId}
            onChange={(e) => setOrcidId(e.target.value)}
            placeholder="0000-0000-0000-0000"
            style={inputStyle}
          />
        </label>
        <label style={lblStyle}>
          Affiliation (optional)
          <input
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 4 }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={corresponding}
            onChange={(e) => setCorresponding(e.target.checked)}
          />
          Corresponding author
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={includeInBrowse}
            onChange={(e) => setIncludeInBrowse(e.target.checked)}
          />
          Show on public listing
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={busy} style={btnPrimary}>
          {busy ? "Saving…" : initial ? "Save" : "Add author"}
        </button>
        <button type="button" onClick={onCancel} style={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- Files ----------

function FilesCard({
  submissionId,
  files,
  genres,
  editable,
  onChange,
}: {
  submissionId: number;
  files: FileRow[];
  genres: GenreResponse[];
  editable: boolean;
  onChange: () => void;
}): ReactNode {
  const [stage, setStage] = useState<FileStage>("MANUSCRIPT");
  const [genreId, setGenreId] = useState<string>(
    genres[0]?.id != null ? String(genres[0].id) : "",
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default genre when genres list changes (loads asynchronously).
  useEffect(() => {
    if (!genreId && genres[0]?.id != null) {
      setGenreId(String(genres[0].id));
    }
  }, [genres, genreId]);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!genreId) {
      setError("Pick a genre first");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("fileStage", stage);
    fd.append("genreId", genreId);
    const ok = await uploadMultipart(`/api/v1/submissions/${submissionId}/files`, fd);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (ok) {
      onChange();
    } else {
      setError("Upload failed. Try again.");
    }
  };

  return (
    <Card padded={false}>
      <div style={{ padding: "16px 22px 0" }}>
        <SectionTitle>Files</SectionTitle>
      </div>

      {editable ? (
        <div
          style={{
            padding: "12px 22px 16px",
            borderBottom: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 2fr",
            gap: 10,
            alignItems: "end",
          }}
        >
          <label style={lblStyle}>
            Stage
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as FileStage)}
              style={inputStyle}
            >
              {FILE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label style={lblStyle}>
            Genre
            <select
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              style={inputStyle}
            >
              {genres.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name?.en ?? (g.name ? Object.values(g.name)[0] : null) ?? `#${g.id}`}
                </option>
              ))}
            </select>
          </label>
          <label style={lblStyle}>
            File (PDF/DOCX/LaTeX)
            <input
              ref={inputRef}
              type="file"
              onChange={handleFiles}
              disabled={busy || !genreId}
              style={{
                ...inputStyle,
                padding: "7px 9px",
                cursor: busy ? "wait" : "pointer",
              }}
            />
          </label>
        </div>
      ) : null}

      {error ? (
        <p
          style={{
            margin: "8px 22px",
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

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {files.length === 0 ? (
          <li style={{ padding: "16px 22px", color: "var(--muted)", fontSize: 13 }}>
            No files yet — upload your manuscript using the form above.
          </li>
        ) : (
          files.map((f, idx) => (
            <li
              key={f.id}
              style={{
                padding: "12px 22px",
                borderBottom: idx < files.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--serif-display)",
                    fontWeight: 500,
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  {f.originalFilename ?? `File #${f.id}`}
                </p>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--muted)",
                    margin: "3px 0 0",
                  }}
                >
                  {f.fileStage} · {f.contentType ?? "?"} ·{" "}
                  {formatBytes(f.sizeBytes ?? 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const url = await api<{ url: string }>(
                    `/api/v1/submissions/${submissionId}/files/${f.id}/download-url`,
                  );
                  if (url?.url) window.open(url.url, "_blank");
                }}
                style={btnSecondary}
              >
                Download
              </button>
              {editable ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Remove ${f.originalFilename}?`)) return;
                    await api(`/api/v1/submissions/${submissionId}/files/${f.id}`, {
                      method: "DELETE",
                    });
                    onChange();
                  }}
                  style={{ ...btnSecondary, color: "#b91c1c", borderColor: "#fca5a5" }}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function uploadMultipart(path: string, body: FormData): Promise<boolean> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) return false;
  const manager = getUserManager();
  let oidcUser = await manager.getUser();
  if (oidcUser?.expired) {
    try {
      oidcUser = await manager.signinSilent();
    } catch {
      // ignore — will surface as 401
    }
  }
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (oidcUser?.access_token) {
    headers.set("Authorization", `Bearer ${oidcUser.access_token}`);
  }
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body,
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------- Submit ----------

function SubmitCard({
  submissionId,
  authors,
  files,
  onSubmitted,
}: {
  submissionId: number;
  authors: AuthorRow[];
  files: FileRow[];
  onSubmitted: () => void;
}): ReactNode {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = authors.length > 0 && files.length > 0;

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const result = await api<Submission>(`/api/v1/submissions/${submissionId}/submit`, {
      method: "POST",
    });
    setBusy(false);
    if (result) {
      onSubmitted();
    } else {
      setError(
        "Submit failed. Make sure title, abstract, at least one contributor, and a manuscript file are present.",
      );
    }
  };

  return (
    <Card>
      <SectionTitle>Submit for editorial review</SectionTitle>
      <ul
        style={{
          margin: "0 0 14px",
          padding: 0,
          listStyle: "none",
          fontSize: 13,
          color: "var(--fg-2)",
          display: "grid",
          gap: 4,
        }}
      >
        <li>{authors.length > 0 ? "✓" : "·"} At least one contributor ({authors.length})</li>
        <li>{files.length > 0 ? "✓" : "·"} At least one uploaded file ({files.length})</li>
      </ul>
      <button
        type="button"
        disabled={busy || !ready}
        onClick={submit}
        style={{
          ...btnPrimary,
          opacity: busy || !ready ? 0.5 : 1,
          cursor: busy || !ready ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Submitting…" : "Submit to editors"}
      </button>
      {error ? (
        <p
          style={{
            margin: "10px 0 0",
            padding: "10px 12px",
            border: "1px solid #fca5a5",
            background: "#fff5f5",
            color: "#b91c1c",
            borderRadius: "var(--r-2)",
            fontSize: 13,
          }}
        >
          {error}
        </p>
      ) : null}
    </Card>
  );
}

// ---------- Tiny helpers ----------

function SectionTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}): ReactNode {
  return (
    <h2
      style={{
        margin: "0 0 12px",
        fontFamily: "var(--serif-display)",
        fontWeight: 600,
        fontSize: 18,
        ...(style ?? {}),
      }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontFamily: "var(--sans)",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "3px 0 0",
          fontFamily: "var(--serif-body)",
          fontSize: 14,
          color: "var(--fg)",
        }}
      >
        {children}
      </p>
    </div>
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
