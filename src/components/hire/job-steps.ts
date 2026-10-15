/** The six steps of the job form (mockup 04-03), shared by the server form and the wizard. */
export const JOB_STEPS = [
  "basics",
  "description",
  "skills",
  "criteria",
  "process",
  "preview",
] as const;
export type JobStep = (typeof JOB_STEPS)[number];
