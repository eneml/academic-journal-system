import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { SignInPrompt } from "../components/SignInPrompt";
import { Badge, OrcidBadge } from "@ajs/ui";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

interface UserProfile {
  id: number;
  email: string;
  username: string;
  givenName?: string;
  familyName?: string;
  locale?: string;
  country?: string;
  status?: string;
  orcidId?: string;
  affiliation?: string;
  publicUrl?: string;
}

function ProfilePage(): ReactNode {
  const { user, roles, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    setProfileMissing(false);
    (async () => {
      const data = await api<UserProfile>("/api/v1/users/me");
      if (cancelled) return;
      if (data) {
        setProfile(data);
      } else {
        setProfileMissing(true);
      }
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return <p className="text-muted text-sm">Loading session…</p>;
  }
  if (!user) {
    return <SignInPrompt />;
  }

  const givenName =
    profile?.givenName ?? (user.profile.given_name as string | undefined) ?? "";
  const familyName =
    profile?.familyName ?? (user.profile.family_name as string | undefined) ?? "";
  const fullName =
    `${givenName} ${familyName}`.trim() ||
    profile?.username ||
    (user.profile.preferred_username as string | undefined) ||
    "—";
  const initials = computeInitials(givenName, familyName, profile?.username);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title={fullName}
        description="Identity, contact details, and roles assigned in this journal."
      />

      <div className="grid gap-3.5 lg:grid-cols-[260px_1fr_280px]">
        {/* Left: avatar + at-a-glance */}
        <Card>
          <div
            className="mb-3 grid aspect-square w-full place-items-end overflow-hidden rounded-md"
            style={{
              background:
                "linear-gradient(155deg, oklch(78% 0.08 280) 0%, oklch(58% 0.12 260) 100%)",
              padding: 16,
            }}
          >
            <span
              className="font-serif-display text-[88px] font-medium leading-none tracking-[-0.03em] text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
            >
              {initials}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-[12px]">
            <Row label="Email">
              <span className="font-mono text-[11.5px]">
                {profile?.email ?? (user.profile.email as string | undefined) ?? "—"}
              </span>
            </Row>
            <Row label="Locale">
              <span className="font-mono">{profile?.locale ?? "en"}</span>
            </Row>
            <Row label="Country">
              <span>{profile?.country ?? "—"}</span>
            </Row>
            <Row label="Status">
              <span>{profile?.status ?? "active"}</span>
            </Row>
          </div>
        </Card>

        {/* Center: editable form view */}
        <Card>
          <p className="sc mb-3 text-muted">Identity</p>
          {fetching ? (
            <p className="text-sm text-muted">Loading profile…</p>
          ) : profile ? (
            <DetailGrid
              rows={[
                ["Username", profile.username],
                ["Display name", fullName],
                ["Email", profile.email],
                ["Affiliation", profile.affiliation ?? "—"],
                ["ORCID iD", profile.orcidId ?? "—"],
                ["Locale", profile.locale ?? "—"],
                ["Country", profile.country ?? "—"],
                ["Status", profile.status ?? "—"],
              ]}
            />
          ) : (
            <ProfileFallback user={user} missing={profileMissing} />
          )}
        </Card>

        {/* Right: identifiers + roles + linked accounts */}
        <div className="flex flex-col gap-3.5">
          <Card>
            <p className="sc mb-3 text-muted">Identifiers</p>
            {profile?.orcidId ? (
              <div className="mb-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-fg">
                  <span style={{ color: "oklch(70% 0.18 130)" }}>iD</span>
                  ORCID
                  <Badge variant="success" withDot>Linked</Badge>
                </div>
                <OrcidBadge id={profile.orcidId} />
              </div>
            ) : (
              <p className="m-0 text-[12px] italic text-muted">
                No ORCID linked yet.
              </p>
            )}
          </Card>

          <Card>
            <p className="sc mb-3 text-muted">Roles</p>
            {roles.length === 0 ? (
              <p className="m-0 text-sm leading-snug text-muted">
                No realm roles found in your access token.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <Badge key={r} variant="cobalt">
                    {r.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <p className="sc mb-3 text-muted">Subject</p>
            <p className="m-0 break-all font-mono text-[11px] text-fg-2">
              {user.profile.sub ?? "—"}
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="text-right text-fg-2">{children}</span>
    </div>
  );
}

function ProfileFallback({
  user,
  missing,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  missing: boolean;
}): ReactNode {
  return (
    <>
      {missing ? (
        <p className="mb-3 text-[12px] text-warn">
          Couldn&rsquo;t load profile from the API. Showing token claims as a fallback.
        </p>
      ) : null}
      <DetailGrid
        rows={[
          ["Username", (user.profile.preferred_username as string | undefined) ?? "—"],
          [
            "Display name",
            [user.profile.given_name, user.profile.family_name].filter(Boolean).join(" ") ||
              "—",
          ],
          ["Email", (user.profile.email as string | undefined) ?? "—"],
        ]}
      />
    </>
  );
}

function DetailGrid({ rows }: { rows: ReadonlyArray<readonly [string, string]> }): ReactNode {
  return (
    <dl className="m-0 grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-[13px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="sc self-center text-muted">{label}</dt>
          <dd className="m-0 font-serif-body text-[15px] text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function computeInitials(g: string, f: string, username: string | undefined): string {
  const fromName = ((g.charAt(0) || "") + (f.charAt(0) || "")).toUpperCase();
  if (fromName) return fromName;
  return (username?.charAt(0) || "?").toUpperCase();
}
