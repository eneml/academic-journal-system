import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/editor/submissions")({
  component: AllSubmissionsPage,
});

function AllSubmissionsPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title="All submissions" />
        <EmptyState
          icon="alert"
          title="Editor access required"
          description="This area is restricted to ADMIN, EDITOR, and SECTION_EDITOR roles."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="All submissions"
        description="Search and filter every submission in the system, across stages and statuses."
      />
      <EmptyState
        icon="layers"
        title="Search & filter view in progress"
        description="A faceted browser over /api/v1/submissions with stage, status, section, and date filters will live here."
      />
    </>
  );
}
