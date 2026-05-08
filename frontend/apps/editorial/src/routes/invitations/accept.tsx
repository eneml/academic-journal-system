import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";

export const Route = createFileRoute("/invitations/accept")({
  validateSearch: (search): { key?: string } => ({
    key: typeof search.key === "string" ? search.key : undefined,
  }),
  component: AcceptInvitationPage,
});

interface InvitationView {
  id: number;
  type: string;
  email: string;
  payload: Record<string, unknown>;
  status: string;
  expiresAt: string;
  acceptedAt: string | null;
}

const PENDING_INVITATION_KEY = "ajs.pendingInvitationKey";

function AcceptInvitationPage(): ReactNode {
  const { key: searchKey } = useSearch({ from: "/invitations/accept" });
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationView | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  // The OIDC redirect drops the query string when it bounces us through
  // Keycloak. Stash the key in sessionStorage on first load and pick it
  // up again post-login so the accept link survives the round trip.
  const [key] = useState<string | undefined>(() => {
    if (searchKey) {
      try {
        sessionStorage.setItem(PENDING_INVITATION_KEY, searchKey);
      } catch {
        // sessionStorage can throw in private mode — accept page falls back
        // to the in-URL key only.
      }
      return searchKey;
    }
    try {
      return sessionStorage.getItem(PENDING_INVITATION_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    if (!key) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await api<InvitationView>(
        `/api/v1/invitations/by-key?key=${encodeURIComponent(key)}`,
      );
      if (cancelled) return;
      setInvitation(data);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  const accept = async (): Promise<void> => {
    if (!key) return;
    setBusy(true);
    const result = await api<InvitationView>(
      `/api/v1/invitations/accept?key=${encodeURIComponent(key)}`,
      { method: "POST" },
    );
    setBusy(false);
    try {
      sessionStorage.removeItem(PENDING_INVITATION_KEY);
    } catch {
      // ignore
    }
    if (result) {
      toast.success("Invitation accepted.");
      void navigate({ to: "/" });
    } else {
      toast.error("Couldn't accept. The invitation may have expired or already been used.");
    }
  };

  const decline = async (): Promise<void> => {
    if (!key) return;
    setBusy(true);
    const result = await api<InvitationView>(
      `/api/v1/invitations/decline?key=${encodeURIComponent(key)}`,
      { method: "POST" },
    );
    setBusy(false);
    try {
      sessionStorage.removeItem(PENDING_INVITATION_KEY);
    } catch {
      // ignore
    }
    if (result) {
      toast.success("Invitation declined.");
      setInvitation({ ...result });
    } else {
      toast.error("Couldn't decline.");
    }
  };

  if (!loaded) {
    return <p className="text-muted">Loading invitation…</p>;
  }
  if (!key) {
    return (
      <>
        <PageHeader eyebrow="Invitation" title="Missing invitation key" />
        <EmptyState
          icon="alert"
          title="No key in the URL"
          description="Use the accept link from your invitation email."
        />
      </>
    );
  }
  if (!invitation) {
    return (
      <>
        <PageHeader eyebrow="Invitation" title="Invitation not found" />
        <EmptyState
          icon="alert"
          title="This invitation is no longer valid"
          description="It may have been cancelled, expired, or never existed. Contact the editors if you think this is a mistake."
        />
      </>
    );
  }

  const expiresAt = new Date(invitation.expiresAt);
  const expired = expiresAt < new Date();

  return (
    <>
      <PageHeader
        eyebrow="Invitation"
        title={`You have been invited as a ${invitation.type.toLowerCase().replace(/_/g, " ")}`}
        description={`The invitation was sent to ${invitation.email}. Valid until ${expiresAt.toLocaleString()}.`}
      />

      <Card>
        <div className="grid gap-3">
          <p className="m-0 font-serif-body text-[14.5px] text-fg-2 leading-[1.6]">
            {invitation.status === "ACCEPTED" ? (
              "You've already accepted this invitation. Welcome aboard."
            ) : invitation.status === "DECLINED" ? (
              "This invitation has been declined."
            ) : invitation.status === "CANCELLED" ? (
              "The editor cancelled this invitation."
            ) : expired ? (
              "This invitation has expired. Ask the editor to send a new one."
            ) : !user ? (
              "Sign in or register with the email above to accept the invitation."
            ) : (
              "Click Accept to confirm. The editor will be notified and you'll be wired into the workflow this invitation references."
            )}
          </p>
          <div className="flex gap-2">
            {invitation.status === "PENDING" && !expired ? (
              user ? (
                <>
                  <Button type="button" onClick={() => void accept()} disabled={busy}>
                    {busy ? "Accepting…" : "Accept"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void decline()}
                    disabled={busy}
                  >
                    Decline
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" onClick={() => void signIn()}>
                    Sign in to accept
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void decline()}
                    disabled={busy}
                  >
                    Decline without signing in
                  </Button>
                </>
              )
            ) : null}
          </div>
        </div>
      </Card>
    </>
  );
}
