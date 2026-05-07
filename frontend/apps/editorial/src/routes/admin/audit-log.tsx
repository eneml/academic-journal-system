import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/audit-log")({
  component: AuditLogPage,
});

function AuditLogPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Audit log" />
        <EmptyState
          icon="alert"
          title="Editorial access required"
          description="The audit log is visible to editors and administrators."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Immutable system event log · streaming"
      />
      <EmptyState
        icon="alert"
        title="Audit log UI coming soon"
        description="Will stream the journal-wide event log with filters by user, action, and entity."
      />
    </>
  );
}
