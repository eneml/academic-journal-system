import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  BookOpen,
  CheckCheck,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api, apiMultipart } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { Badge } from "@ajs/ui";
import { Button } from "@ajs/ui";
import { Input } from "@ajs/ui";
import { Textarea } from "../../components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { Separator } from "@ajs/ui";

export const Route = createFileRoute("/editor/issues")({
  component: IssuesAdminPage,
});

type IssueResponse = components["schemas"]["IssueResponse"];

function IssuesAdminPage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<IssueResponse[] | null>(null);
  // Single source of truth for which sheet is open. Holds the issue being
  // edited, or `"new"` for a fresh issue, or null when no sheet is open.
  const [sheetMode, setSheetMode] = useState<"new" | IssueResponse | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    const list = await api<IssueResponse[]>("/api/v1/issues");
    setIssues(list ?? []);
  }, []);

  useEffect(() => {
    if (user && isEditorial(roles)) void reload();
  }, [user, roles, reload]);

  if (authLoading) return <p className="text-muted text-sm">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title="Issues" />
        <EmptyState icon="alert" title="Editor access required" description="" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="Issues"
        description="Volumes and numbers grouping published articles. Create one ahead of publication; publish when articles are ready."
        actions={
          <Button onClick={() => setSheetMode("new")}>
            <Plus />
            New issue
          </Button>
        }
      />

      {issues == null ? (
        <p className="text-muted text-sm py-3">Loading issues…</p>
      ) : issues.length === 0 ? (
        <EmptyState
          icon="layers"
          title="No issues yet"
          description="Create your first volume + number above. Articles get assigned to issues from the publication editor."
        />
      ) : (
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <ul className="divide-y divide-border">
            {issues
              .slice()
              .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
              .map((i) => (
                <IssueRow
                  key={i.id}
                  issue={i}
                  onEdit={() => setSheetMode(i)}
                  onChanged={() => void reload()}
                />
              ))}
          </ul>
        </div>
      )}

      {/* Issue create / edit Sheet. */}
      <Sheet
        open={sheetMode != null}
        onOpenChange={(open) => {
          if (!open) setSheetMode(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl flex flex-col p-0"
        >
          {sheetMode != null ? (
            <IssueForm
              key={sheetMode === "new" ? "new" : sheetMode.id}
              initial={sheetMode === "new" ? null : sheetMode}
              onSaved={() => {
                setSheetMode(null);
                void reload();
              }}
              onCancel={() => setSheetMode(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function IssueRow({
  issue,
  onEdit,
  onChanged,
}: {
  issue: IssueResponse;
  onEdit: () => void;
  onChanged: () => void;
}): ReactNode {
  const [busy, setBusy] = useState(false);

  const publish = async (): Promise<void> => {
    if (!confirm(`Publish "${labelOf(issue)}"? Assigned articles become public.`))
      return;
    setBusy(true);
    const result = await api<IssueResponse>(
      `/api/v1/issues/${issue.id}/publish`,
      { method: "POST" },
    );
    setBusy(false);
    if (result == null) {
      toast.error("Couldn't publish — try again.");
      return;
    }
    toast.success(`Published "${labelOf(issue)}".`, {
      description: `Live at /issues/${issue.urlPath ?? issue.id}`,
    });
    onChanged();
  };

  const unpublish = async (): Promise<void> => {
    if (!confirm("Unpublish — readers lose access. Continue?")) return;
    setBusy(true);
    const result = await api<IssueResponse>(
      `/api/v1/issues/${issue.id}/unpublish`,
      { method: "POST" },
    );
    setBusy(false);
    if (result == null) {
      toast.error("Couldn't unpublish — try again.");
      return;
    }
    toast.success(`Unpublished "${labelOf(issue)}".`);
    onChanged();
  };

  const remove = async (): Promise<void> => {
    if (issue.published) {
      toast.warning("Unpublish first", {
        description: "Published issues can't be deleted in one step.",
      });
      return;
    }
    if (!confirm(`Delete "${labelOf(issue)}"? Cannot be undone.`)) return;
    setBusy(true);
    const result = await api<unknown>(`/api/v1/issues/${issue.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    // DELETE returns 204 → api() returns null on success too. Distinguish via
    // optimistic toast either way; the reload will reveal a failure.
    toast.success(`Deleted "${labelOf(issue)}".`);
    void result;
    onChanged();
  };

  return (
    <li className="flex items-center gap-4 p-4">
      {/* Cover thumbnail */}
      <div
        className="size-12 rounded-md border border-border flex-none overflow-hidden flex items-center justify-center"
        style={{
          backgroundImage: issue.coverImageUrl
            ? `url(${issue.coverImageUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: issue.coverImageUrl ? undefined : "var(--cobalt)",
        }}
        aria-hidden
      >
        {!issue.coverImageUrl ? (
          <ImageIcon className="size-4 text-white/70" />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-serif-display text-base font-semibold text-fg truncate">
          {labelOf(issue)}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {issue.published ? (
            <Badge variant="cobalt">published</Badge>
          ) : (
            <Badge variant="amber">draft</Badge>
          )}
          <Badge variant={issue.accessStatus === "OPEN" ? "default" : "outline"}>
            {(issue.accessStatus ?? "open").toLowerCase()}
          </Badge>
          {issue.datePublished ? (
            <span className="text-[11px] text-muted font-mono ml-1">
              {new Date(issue.datePublished).toLocaleDateString()}
            </span>
          ) : null}
          {issue.urlPath ? (
            <a
              href={`${import.meta.env.VITE_PUBLIC_SITE_URL ?? "http://localhost:3000"}/issues/${encodeURIComponent(issue.urlPath)}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-cobalt font-mono ml-1 hover:underline inline-flex items-center gap-0.5"
            >
              /issues/{issue.urlPath}
              <ArrowUpRight className="size-3" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-none">
        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
          disabled={busy}
        >
          <Pencil />
          Edit
        </Button>
        {issue.published ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={unpublish}
            disabled={busy}
          >
            <EyeOff />
            Unpublish
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={publish}
            disabled={busy}
            className="text-cobalt-deep border-cobalt/20 hover:bg-cobalt-soft hover:border-cobalt/40 hover:text-cobalt-deep"
          >
            <CheckCheck />
            Publish
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={remove}
          disabled={busy || issue.published}
        >
          <Trash2 />
          Delete
        </Button>
      </div>
    </li>
  );
}

function IssueForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: IssueResponse | null;
  onSaved: () => void;
  onCancel: () => void;
}): ReactNode {
  const [volume, setVolume] = useState(initial?.volume ? String(initial.volume) : "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [year, setYear] = useState(
    initial?.year ? String(initial.year) : String(new Date().getFullYear()),
  );
  const [title, setTitle] = useState(initial?.title?.en ?? "");
  const [description, setDescription] = useState(initial?.description?.en ?? "");
  const [urlPath, setUrlPath] = useState(initial?.urlPath ?? "");
  const [accessStatus, setAccessStatus] = useState<"OPEN" | "RESTRICTED">(
    (initial?.accessStatus as "OPEN" | "RESTRICTED") ?? "OPEN",
  );
  const [showVolume, setShowVolume] = useState(initial?.showVolume ?? true);
  const [showNumber, setShowNumber] = useState(initial?.showNumber ?? true);
  const [showYear, setShowYear] = useState(initial?.showYear ?? true);
  const [showTitle, setShowTitle] = useState(initial?.showTitle ?? true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initial?.coverImageUrl ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await api<IssueResponse>(
      initial ? `/api/v1/issues/${initial.id}` : "/api/v1/issues",
      {
        method: initial ? "PUT" : "POST",
        body: {
          volume: volume ? Number.parseInt(volume, 10) : null,
          number: number || null,
          year: year ? Number.parseInt(year, 10) : null,
          title: title ? { en: title } : {},
          description: description ? { en: description } : {},
          urlPath: urlPath.trim() || null,
          coverImagePath: null,
          showVolume,
          showNumber,
          showYear,
          showTitle,
          accessStatus,
        },
      },
    );
    if (result === null) {
      setBusy(false);
      setError("Save failed. The url-path may already be taken.");
      toast.error("Couldn't save the issue.");
      return;
    }
    if (coverFile) {
      const fd = new FormData();
      fd.append("file", coverFile);
      const uploaded = await apiMultipart<IssueResponse>(
        `/api/v1/issues/${result.id}/cover`,
        fd,
      );
      if (uploaded === null) {
        setBusy(false);
        setError(
          "Issue saved, but cover upload failed. Try again from Edit (max 5 MB; JPG/PNG/WebP/GIF).",
        );
        toast.warning("Cover upload failed.", {
          description: "The issue was saved without it. Re-upload from Edit.",
        });
        onSaved();
        return;
      }
    }
    setBusy(false);
    toast.success(initial ? "Issue updated." : "Issue created.");
    onSaved();
  };

  const removeCover = async (): Promise<void> => {
    if (!initial || initial.coverFileId == null) {
      setCoverFile(null);
      setCoverPreview(null);
      return;
    }
    if (!confirm("Remove the existing cover image?")) return;
    setBusy(true);
    const result = await api<IssueResponse>(
      `/api/v1/issues/${initial.id}/cover`,
      { method: "DELETE" },
    );
    setBusy(false);
    if (result === null) {
      toast.error("Couldn't remove the cover.");
      return;
    }
    setCoverFile(null);
    setCoverPreview(null);
    toast.success("Cover removed.");
    onSaved();
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col h-full"
    >
      <SheetHeader>
        <div className="flex items-center gap-2 text-cobalt-deep">
          <BookOpen className="size-4" />
          <span className="text-[11px] uppercase tracking-[0.08em] font-semibold">
            {initial ? "Edit issue" : "New issue"}
          </span>
        </div>
        <SheetTitle>
          {initial ? labelOf(initial) : "Create a new issue"}
        </SheetTitle>
        <SheetDescription>
          Volumes and numbers group articles. Set the masthead, cover, and
          access; publish when the table of contents is ready.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Masthead grid */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Volume">
            <Input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
          </Field>
          <Field label="Number">
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </Field>
          <Field label="Year">
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Title (optional)"
          hint='e.g. "Special issue: Phenomenology"'
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Description (optional)">
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="font-serif-body"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="URL slug" hint="e.g. 2026-spring">
            <Input
              value={urlPath}
              onChange={(e) => setUrlPath(e.target.value)}
              placeholder="2026-spring"
            />
          </Field>
          <Field label="Access">
            <select
              value={accessStatus}
              onChange={(e) =>
                setAccessStatus(e.target.value as "OPEN" | "RESTRICTED")
              }
              className="h-9 rounded-md border border-border bg-white px-3 text-sm font-sans text-fg focus-visible:outline-none focus-visible:border-cobalt"
            >
              <option value="OPEN">Open access</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </Field>
        </div>

        <Separator />

        {/* Cover image picker */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.06em] text-muted font-semibold">
            Cover image (optional)
          </label>
          <div className="flex gap-3 items-start p-3 border border-dashed border-border-strong rounded-md bg-bg-tint/40">
            <div
              className="aspect-[3/4] w-20 flex-none rounded border border-border flex items-center justify-center text-white text-[10px] font-serif-display text-center px-2 leading-tight"
              style={{
                backgroundImage: coverPreview ? `url(${coverPreview})` : undefined,
                backgroundColor: coverPreview ? undefined : "var(--cobalt)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {coverPreview ? null : volume || number ? (
                `Vol. ${volume || "?"} № ${number || "?"}`
              ) : (
                "no cover"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="text-[12px] font-sans"
              />
              <p className="mt-2 text-[11.5px] text-muted leading-relaxed">
                JPG, PNG, WebP, or GIF · max 5 MB · 3:4 portrait recommended.
              </p>
              {coverFile || (initial?.coverFileId ?? null) != null ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeCover}
                  disabled={busy}
                  className="mt-2"
                >
                  <X />
                  {coverFile && (initial?.coverFileId ?? null) == null
                    ? "Drop selection"
                    : "Remove cover"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <Separator />

        {/* Visibility toggles */}
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="text-[10px] uppercase tracking-[0.06em] text-muted font-semibold mb-2">
            Show on masthead
          </legend>
          <Toggle label="Volume" checked={showVolume} onCheckedChange={setShowVolume} />
          <Toggle label="Number" checked={showNumber} onCheckedChange={setShowNumber} />
          <Toggle label="Year" checked={showYear} onCheckedChange={setShowYear} />
          <Toggle label="Title" checked={showTitle} onCheckedChange={setShowTitle} />
        </fieldset>

        {error ? (
          <div className="rounded-md border border-[#fca5a5] bg-[#fff5f5] text-[#b91c1c] px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}
      </div>

      <SheetFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <>Saving…</>
          ) : (
            <>
              <Layers />
              {initial ? "Save changes" : "Create issue"}
            </>
          )}
        </Button>
      </SheetFooter>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label className="space-y-1 block">
      <span className="block text-[10px] uppercase tracking-[0.06em] text-muted font-semibold">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-[11px] text-muted-2">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}): ReactNode {
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-white cursor-pointer hover:border-border-strong transition-colors text-[12.5px] text-fg-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="size-4 accent-cobalt"
      />
      Show {label}
    </label>
  );
}

function labelOf(i: IssueResponse): string {
  if (i.title?.en) return i.title.en;
  const parts = [
    i.volume ? `Vol. ${i.volume}` : null,
    i.number ? `No. ${i.number}` : null,
    i.year ? `(${i.year})` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `Issue #${i.id}`;
}
