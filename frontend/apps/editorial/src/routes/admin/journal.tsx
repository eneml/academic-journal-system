import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { hasRole } from "../../auth/roles";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/journal")({
  component: JournalSettingsPage,
});

function JournalSettingsPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!hasRole(roles, "ADMIN")) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Journal settings" />
        <EmptyState
          icon="alert"
          title="Admin access required"
          description="This area is restricted to ADMIN role holders."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Journal settings"
        description="Sections, masthead, genres, and policies for the journal."
      />
      <EmptyState
        icon="settings"
        title="Settings UI coming soon"
        description="Surface for /api/v1/journal, /api/v1/sections, /api/v1/genres, and /api/v1/masthead. Read-only fetches will land here first, then editing."
      />
    </>
  );
}
