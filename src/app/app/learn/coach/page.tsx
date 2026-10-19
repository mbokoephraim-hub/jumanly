import { redirect } from "next/navigation";

/** The old learning coach: Orbi answers in each lesson, and in its own conversation. */
export default function LearnCoachRedirect() {
  redirect("/app/orbi");
}
