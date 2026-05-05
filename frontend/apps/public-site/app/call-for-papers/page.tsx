import { permanentRedirect } from "next/navigation";

// Legacy slug — calls for papers are now part of the unified Announcements
// page. Permanent redirect so external links keep working.
export default function CallForPapersRedirect(): never {
  permanentRedirect("/announcements");
}
