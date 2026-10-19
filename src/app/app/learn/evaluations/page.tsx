import { redirect } from "next/navigation";

/** The old list of evaluations: quizzes and exercises to do are in « Mes formations ». */
export default function LearnEvaluationsRedirect() {
  redirect("/app/learn/mes-formations");
}
