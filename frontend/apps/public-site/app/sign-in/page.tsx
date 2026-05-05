import { redirect } from "next/navigation";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

// Sign-in lives in the editorial app — bounce any direct hits to /sign-in
// over there so the public site never has to host an auth UI.
export default function SignInRedirect(): never {
  redirect(EDITORIAL_APP_URL);
}
