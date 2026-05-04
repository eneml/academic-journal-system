import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/author/submissions/new")({
  component: NewSubmissionPage,
});

function NewSubmissionPage(): ReactNode {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;

  return (
    <>
      <PageHeader
        eyebrow="Author"
        title="New submission"
        description="Start a new manuscript. The submission wizard — section, files, contributors, metadata — will land here."
      />
      <EmptyState
        icon="upload"
        title="Submission wizard coming soon"
        description="This screen will host the multi-step flow for creating a draft, uploading files, and adding contributors. Backed by POST /api/v1/submissions."
      />
    </>
  );
}
