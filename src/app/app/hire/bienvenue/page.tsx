import { redirect } from "next/navigation";

/** The recruiter's first steps live at `/app/bienvenue` (lot 1); the brief's address leads there. */
export default function HireWelcomeRedirect() {
  redirect("/app/bienvenue");
}
