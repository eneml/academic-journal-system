import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Plus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/invitations")({
  component: InvitationsPage,
});

type InvitationType = "REVIEWER" | "EDITOR" | "SECTION_EDITOR" | "AUTHOR" | "OTHER";
type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";

interface Invitation {
  id: number;
  type: InvitationType;
  email: string;
  payload: Record<string, unknown>;
  status: InvitationStatus;
  invitedByUserId: number;
  acceptedUserId: number | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

function InvitationsPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Invitations" />
        <EmptyState
          icon="alert"
          title="Editorial access required"
          description="Inviting users is restricted to editors and administrators."
        />
      </>
    );
  }
  return <InvitationsAdmin />;
}

function InvitationsAdmin(): ReactNode {
  const [items, setItems] = useState<Invitation[] | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = async (): Promise<void> => {
    const data = await api<Invitation[]>("/api/v1/invitations");
    setItems(data ?? []);
  };

  useEffect(() => {
    void reload();
  }, []);

  const cancel = async (id: number): Promise<void> => {
    if (!confirm("Cancel this invitation?")) return;
    const result = await api<Invitation>(`/api/v1/invitations/${id}`, { method: "DELETE" });
    if (result) {
      toast.success("Invitation cancelled.");
      void reload();
    } else {
      toast.error("Couldn't cancel.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Invitations"
        description="Invite a reviewer or editor who isn't yet on the system. They'll get an email with a one-click accept link."
        actions={
          <Button type="button" onClick={() => setCreating(true)} disabled={creating}>
            <Plus />
            New invitation
          </Button>
        }
      />

      {creating ? (
        <InvitationForm
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void reload();
          }}
        />
      ) : null}

      {items == null ? (
        <p className="text-muted">Loading invitations…</p>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="No invitations yet"
            description="Send the first one above."
          />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="grid grid-cols-[140px_1fr_120px_140px_140px_70px] items-center gap-3 border-b border-border px-5 py-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span>Type</span>
            <span>Email</span>
            <span>Status</span>
            <span>Expires</span>
            <span>Created</span>
            <span></span>
          </div>
          {items.map((i) => (
            <div
              key={i.id}
              className="grid grid-cols-[140px_1fr_120px_140px_140px_70px] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
            >
              <span className="font-mono text-[11px] text-fg-2">
                {i.type.toLowerCase().replace(/_/g, " ")}
              </span>
              <span className="font-mono text-[12px] text-fg truncate">
                {i.email}
              </span>
              <StatusChip status={i.status} />
              <span className="font-mono text-[11px] text-muted">
                {fmt(i.expiresAt)}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {fmt(i.createdAt)}
              </span>
              <div className="text-right">
                {i.status === "PENDING" ? (
                  <button
                    type="button"
                    onClick={() => void cancel(i.id)}
                    className="text-danger hover:underline text-[11.5px] inline-flex items-center gap-1"
                  >
                    <X className="size-3" /> Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function InvitationForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}): ReactNode {
  const [type, setType] = useState<InvitationType>("REVIEWER");
  const [email, setEmail] = useState("");
  const [submissionId, setSubmissionId] = useState<string>("");
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const payload: Record<string, unknown> = {};
    if (type === "REVIEWER" && submissionId.trim()) {
      const id = Number.parseInt(submissionId.trim(), 10);
      if (Number.isFinite(id) && id > 0) payload.submissionId = id;
    }
    const result = await api(
      "/api/v1/invitations",
      {
        method: "POST",
        body: { type, email: email.trim(), payload, expiresInDays },
      },
    );
    setBusy(false);
    if (result) {
      toast.success("Invitation sent.", {
        description: "An email with the accept link is on its way.",
      });
      onCreated();
    } else {
      toast.error("Couldn't send the invitation.");
    }
  };

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-[180px_1fr]">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-2">
              Type
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InvitationType)}
              className="rounded-md border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="REVIEWER">Reviewer</option>
              <option value="EDITOR">Editor</option>
              <option value="SECTION_EDITOR">Section editor</option>
              <option value="AUTHOR">Author</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-2">
              Email
            </span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="newperson@example.org"
              required
            />
          </label>
        </div>

        {type === "REVIEWER" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-2">
              Submission to bind on accept (optional)
            </span>
            <Input
              type="number"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="e.g. 12 — auto-assigns the new reviewer to that submission once they finish setup"
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-2">
            Valid for (days)
          </span>
          <Input
            type="number"
            min={1}
            max={90}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number.parseInt(e.target.value, 10) || 14)}
            className="max-w-[120px]"
          />
        </label>

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            <Send />
            {busy ? "Sending…" : "Send invitation"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function StatusChip({ status }: { status: InvitationStatus }): ReactNode {
  const cls = {
    PENDING: "bg-amber-soft text-amber-deep",
    ACCEPTED: "bg-success-soft text-success-deep",
    DECLINED: "bg-bg-tint text-muted",
    EXPIRED: "bg-bg-tint text-muted",
    CANCELLED: "bg-danger-soft text-danger-deep",
  }[status];
  return (
    <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider ${cls}`}>
      {status.toLowerCase()}
    </span>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}
