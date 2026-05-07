import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { SignInPrompt } from "../components/SignInPrompt";
import { Badge } from "@ajs/ui";

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
    return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  }
  if (!user) {
    return <SignInPrompt />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Identity, contact details, and roles assigned in this journal."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 16,
        }}
      >
        <Card>
          <p className="sc" style={{ color: "var(--muted)", marginBottom: 12 }}>
            Identity
          </p>
          {fetching ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading profile&hellip;</p>
          ) : profile ? (
            <DetailGrid
              rows={[
                ["Username", profile.username],
                [
                  "Display name",
                  [profile.givenName, profile.familyName].filter(Boolean).join(" ") || "—",
                ],
                ["Email", profile.email],
                ["Affiliation", profile.affiliation ?? "—"],
                ["ORCID iD", profile.orcidId ?? "—"],
                ["Locale", profile.locale ?? "—"],
                ["Country", profile.country ?? "—"],
                ["Status", profile.status ?? "—"],
              ]}
            />
          ) : (
            <ProfileFallback
              user={user}
              missing={profileMissing}
            />
          )}
        </Card>

        <Card>
          <p className="sc" style={{ color: "var(--muted)", marginBottom: 12 }}>
            Roles
          </p>
          {roles.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
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
          <hr className="rule" style={{ margin: "16px 0", border: 0 }} />
          <p className="sc" style={{ color: "var(--muted)", marginBottom: 6 }}>
            Subject
          </p>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--fg-2)",
              wordBreak: "break-all",
              margin: 0,
            }}
          >
            {user.profile.sub ?? "—"}
          </p>
        </Card>
      </div>
    </>
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
        <p
          style={{
            color: "var(--warn)",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
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
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        rowGap: 10,
        columnGap: 16,
        margin: 0,
        fontSize: 13,
      }}
    >
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "contents" }}>
          <dt
            className="sc"
            style={{
              color: "var(--muted)",
              alignSelf: "center",
            }}
          >
            {label}
          </dt>
          <dd
            style={{
              margin: 0,
              color: "var(--fg)",
              fontFamily: "var(--serif-body)",
              fontSize: 15,
            }}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
