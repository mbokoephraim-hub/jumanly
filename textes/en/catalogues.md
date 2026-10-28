# Jumanly · Public site · courses, jobs, companies and portfolios (English)

English version of the public site texts (`textes/textes-application.md`). Same keys as French:
`pnpm messages` writes `messages/en.json`, laid over French at run time. A key missing here keeps
its French text. Variables (`{price}`, `{count, plural, …}`) must stay the same. Texts in square
brackets are placeholders hidden on the site until they are filled in.

### `trainings`

| Clé | Texte |
|---|---|
| `trainings.seo.title` | Jumanly Learn courses · Employability and professional skills |
| `trainings.seo.description` | Video courses, exercises and certificates to boost your employability. A selection is free, the others are included in the Starter, Pro and Premium plans. |
| `trainings.hero.eyebrow` | Jumanly Learn |
| `trainings.hero.title` | Courses |
| `trainings.hero.text` | Video courses, materials, exercises, assessments and certificates. Start with the free courses, then unlock more learning paths depending on your plan. |
| `trainings.search.label` | Search for a course |
| `trainings.search.placeholder` | E.g.: interview, CV, public speaking |
| `trainings.search.submit` | Search |
| `trainings.filters.title` | Filters |
| `trainings.filters.open` | Filter |
| `trainings.filters.apply` | Show results |
| `trainings.filters.reset` | Clear filters |
| `trainings.filters.theme.label` | Topic |
| `trainings.filters.theme.all` | All topics |
| `trainings.filters.level.label` | Level |
| `trainings.filters.level.all` | All levels |
| `trainings.filters.level.beginner` | Beginner |
| `trainings.filters.level.intermediate` | Intermediate |
| `trainings.filters.level.advanced` | Advanced |
| `trainings.filters.access.label` | Access |
| `trainings.filters.access.all` | All courses |
| `trainings.filters.access.free` | Free |
| `trainings.filters.access.starter` | Included in Starter |
| `trainings.filters.access.pro` | Included in Pro |
| `trainings.filters.access.premium` | Included in Premium |
| `trainings.sort.label` | Sort by |
| `trainings.sort.recent` | Most recent |
| `trainings.sort.popular` | Most followed |
| `trainings.sort.duration` | Duration |
| `trainings.results.count` | {count, plural, =0 {No courses} one {# course} other {# courses}} |
| `trainings.card.duration` | {duration} |
| `trainings.card.lessons` | {count, plural, one {# lesson} other {# lessons}} |
| `trainings.card.level` | {level} level |
| `trainings.card.certificate` | Certificate |
| `trainings.card.badge.free` | Free |
| `trainings.card.badge.plan` | Included in {plan} |
| `trainings.card.cta` | See the course |
| `trainings.card.imageAlt` | Illustration of the course {title} |
| `trainings.empty.title` | No course matches your search |
| `trainings.empty.text` | Try other keywords or remove a filter. |
| `trainings.empty.cta` | Clear filters |
| `trainings.emptyCatalog.title` | The catalog is on its way |
| `trainings.emptyCatalog.text` | The first courses are coming soon. Create your account to be notified when they open. |
| `trainings.pagination.prev` | Previous |
| `trainings.pagination.next` | Next |
| `trainings.pagination.page` | Page {page} of {total} |
| `trainings.banner.title` | Unlock more courses |
| `trainings.banner.text` | The Starter, Pro and Premium plans gradually open the fundamental courses, the standard paths and the advanced paths. |
| `trainings.banner.cta` | See the plans |

### `training`

| Clé | Texte |
|---|---|
| `training.seo.title` | {title} · Jumanly Learn course |
| `training.seo.description` | {summary} Duration: {duration}. Level: {level}. |
| `training.breadcrumb.trainings` | Courses |
| `training.badge.free` | Free course |
| `training.badge.plan` | Included in {plan} and above |
| `training.meta.duration` | Duration: {duration} |
| `training.meta.level` | Level: {level} |
| `training.meta.lessons` | {count, plural, one {# lesson} other {# lessons}} |
| `training.meta.certificate` | Certificate of completion |
| `training.meta.language` | Language: {language} |
| `training.about.title` | About this course |
| `training.objectives.title` | What you will learn |
| `training.audience.title` | Who is it for? |
| `training.program.title` | Program |
| `training.program.module` | Module {number} · {title} |
| `training.program.lessonDuration` | {duration} |
| `training.program.preview` | Free preview |
| `training.program.locked` | Available after sign-up |
| `training.preview.title` | Preview of the first lesson |
| `training.preview.text` | Watch the first lesson for free, without creating an account. |
| `training.preview.play` | Play the preview |
| `training.preview.position` | Module {module} · Lesson {lesson} |
| `training.preview.videoAlt` | Preview video of the course {title} |
| `training.certificate.title` | A certificate to showcase |
| `training.certificate.text` | When you finish the course and its assessments, you get a downloadable certificate, verifiable through a public link and visible on your profile. |
| `training.certificate.sample.intro` | Jumanly certifies that |
| `training.certificate.sample.text` | has taken and completed “{title}” ({duration}). |
| `training.instructor.role` | Instructor of this course |
| `training.cta.start` | Start |
| `training.cta.startFree` | Start for free |
| `training.cta.requiredPlan` | This course is included in the {plan} plan. Create your account to access it. |
| `training.cta.seePlans` | See the plans |
| `training.cta.note` | Free sign-up. You will come straight back to this course. |
| `training.related.title` | Related courses |
| `training.notFound.title` | Course not found |
| `training.notFound.text` | This course does not exist or is no longer available. |
| `training.notFound.cta` | See the catalog |

### `jobs`

| Clé | Texte |
|---|---|
| `jobs.seo.title` | Jobs, internships and assignments · Jumanly Jobs |
| `jobs.seo.description` | Find jobs, internships and assignments and apply for free. Follow each application step by step on Jumanly. |
| `jobs.hero.eyebrow` | Jumanly Jobs |
| `jobs.hero.title` | Job offers |
| `jobs.hero.text` | Jobs, internships and assignments posted by recruiters and companies. Applying is always free. |
| `jobs.search.keyword.label` | Keyword |
| `jobs.search.keyword.placeholder` | Job, skill, company |
| `jobs.search.city.label` | City |
| `jobs.search.city.placeholder` | Your city |
| `jobs.search.country.label` | Country |
| `jobs.search.country.placeholder` | All countries |
| `jobs.search.contract.label` | Contract type |
| `jobs.search.contract.all` | All contracts |
| `jobs.search.contract.cdi` | Permanent |
| `jobs.search.contract.cdd` | Fixed-term |
| `jobs.search.contract.internship` | Internship |
| `jobs.search.contract.mission` | Assignment or freelance |
| `jobs.search.contract.alternance` | Work-study |
| `jobs.search.contract.volunteer` | Volunteering |
| `jobs.search.remote.label` | Remote work |
| `jobs.search.remote.all` | Any |
| `jobs.search.remote.onsite` | On site |
| `jobs.search.remote.hybrid` | Hybrid |
| `jobs.search.remote.full` | Fully remote |
| `jobs.search.submit` | Search |
| `jobs.search.reset` | Clear filters |
| `jobs.search.openFilters` | Filters |
| `jobs.search.filtersCount` | {count, plural, =0 {Filters} other {Filters · #}} |
| `jobs.results.count` | {count, plural, =0 {No offers} one {# offer} other {# offers}} |
| `jobs.sort.label` | Sort by |
| `jobs.sort.recent` | Most recent |
| `jobs.sort.deadline` | Closing soon |
| `jobs.card.company` | {company} |
| `jobs.card.location` | {city}, {country} |
| `jobs.card.remote.onsite` | On site |
| `jobs.card.remote.hybrid` | Hybrid |
| `jobs.card.remote.full` | Remote |
| `jobs.card.published` | Posted {relativeDate} |
| `jobs.card.deadline` | Deadline: {date} |
| `jobs.card.verified` | Verified company |
| `jobs.card.save` | Save the offer |
| `jobs.card.saveLoginHint` | Sign in to save this offer. |
| `jobs.card.cta` | See the offer |
| `jobs.card.logoAlt` | {company} logo |
| `jobs.matchHint.text` | Sign in to see how well you match each offer and why. |
| `jobs.matchHint.cta` | Sign in |
| `jobs.empty.title` | No offer matches your search |
| `jobs.empty.text` | Widen the area, remove a filter or try another keyword. |
| `jobs.empty.cta` | Clear filters |
| `jobs.emptyAll.title` | The first offers are coming soon |
| `jobs.emptyAll.text` | Create your account now to prepare your profile and be notified of new offers. |
| `jobs.emptyAll.cta` | Create my free account |
| `jobs.recruiterBanner.title` | Hiring? |
| `jobs.recruiterBanner.text` | Post your first offer for free with RH Free. |
| `jobs.recruiterBanner.cta` | Post an offer |
| `jobs.pagination.prev` | Previous |
| `jobs.pagination.next` | Next |
| `jobs.pagination.page` | Page {page} of {total} |

### `job`

| Clé | Texte |
|---|---|
| `job.seo.title` | {title} · {company} · {city} · Jumanly |
| `job.seo.description` | {company} is hiring: {title} in {city}, {contract}. Apply for free on Jumanly. |
| `job.breadcrumb.jobs` | Job offers |
| `job.header.company` | {company} |
| `job.header.verified` | Verified company |
| `job.header.verifiedHelp` | Jumanly has verified the identity of this company. |
| `job.header.location` | {city}, {country} |
| `job.header.contract` | {contract} |
| `job.header.remote` | {remote} |
| `job.header.salary` | {salary} |
| `job.header.salaryHidden` | Salary not disclosed |
| `job.header.published` | Posted on {date} |
| `job.header.deadline` | Applications until {date} |
| `job.header.logoAlt` | {company} logo |
| `job.cta.apply` | Apply for free |
| `job.cta.applyNote` | Free, whatever your plan. You will come back to this offer after signing in. |
| `job.cta.save` | Save |
| `job.cta.share` | Share |
| `job.cta.shareCopied` | Link copied. |
| `job.cta.report` | Report this offer |
| `job.description.title` | Job description |
| `job.missions.title` | Responsibilities |
| `job.requirements.title` | Profile we are looking for |
| `job.skills.required` | Required skills |
| `job.skills.preferred` | Preferred skills |
| `job.criteria.title` | Essential criteria |
| `job.criteria.help` | These criteria are set by the recruiter. They are shown so that you know exactly what is expected. |
| `job.languages.title` | Languages |
| `job.benefits.title` | What we offer |
| `job.process.title` | Hiring process |
| `job.company.title` | About {company} |
| `job.company.cta` | See the company page |
| `job.match.title` | How well you match this offer |
| `job.match.text` | Sign in to see your match score, the reasons for this score and the courses that can close a gap. |
| `job.match.cta` | Sign in |
| `job.closed.title` | This offer no longer accepts applications |
| `job.closed.text` | Discover other similar offers. |
| `job.closed.cta` | See similar offers |
| `job.similar.title` | Similar offers |
| `job.notFound.title` | Offer not found |
| `job.notFound.text` | This offer has been removed or does not exist. |
| `job.notFound.cta` | See all offers |
| `job.report.title` | Report this offer |
| `job.report.reason.label` | Reason |
| `job.report.reason.fraud` | Fraudulent offer or request for money |
| `job.report.reason.discrimination` | Discriminatory content |
| `job.report.reason.misleading` | Misleading information |
| `job.report.reason.other` | Other |
| `job.report.details.label` | Details |
| `job.report.details.placeholder` | Describe what seems wrong to you. |
| `job.report.submit` | Send the report |
| `job.report.loginRequired` | Sign in to report an offer. |
| `job.report.success` | Thank you. Our team will review this offer. |
| `job.safety.text` | A recruiter must never ask you for money to apply. If in doubt, report the offer. |

### `companyPage`

| Clé | Texte |
|---|---|
| `companyPage.seo.title` | {company} · Offers and overview · Jumanly |
| `companyPage.seo.description` | Discover {company} and its open offers. Apply for free on Jumanly. |
| `companyPage.verified` | Verified company |
| `companyPage.hiringNow` | Hiring now |
| `companyPage.logoAlt` | {company} logo |
| `companyPage.coverAlt` | Cover image of {company} |
| `companyPage.sector` | Sector: {sector} |
| `companyPage.size` | Size: {size} |
| `companyPage.location` | Head office: {city}, {country} |
| `companyPage.website` | Website |
| `companyPage.about.title` | Overview |
| `companyPage.jobs.title` | Open offers |
| `companyPage.jobs.count` | {count, plural, =0 {No open offers} one {# open offer} other {# open offers}} |
| `companyPage.jobs.empty` | This company has no open offer at the moment. |
| `companyPage.jobs.emptyCta` | See all offers |
| `companyPage.jobs.row` | {city} · {contract} |
| `companyPage.notFound.title` | Company not found |
| `companyPage.notFound.text` | This page does not exist or is no longer public. |

### `learn`

| Clé | Texte |
|---|---|
| `learn.card.modules` | {count, plural, one {# module} other {# modules}} |
| `learn.card.instructor` | {name} |
| `learn.pdf.title` | As a PDF |
| `learn.pdf.programme` | Download the program |
| `learn.pdf.programmeHint` | Goals, modules and lessons, to keep or share. |

### `career`

| Clé | Texte |
|---|---|
| `career.portfolio.project.context` | Context |
| `career.portfolio.project.role` | Your role |
| `career.portfolio.project.result` | Result |
| `career.portfolio.project.skills` | Skills used |
| `career.portfolio.page.footer` | Portfolio published on Jumanly |
| `career.portfolio.page.seo` | Portfolio · Jumanly |
| `career.portfolio.page.eyebrow` | Portfolio |
| `career.portfolio.page.projects` | Projects |
| `career.portfolio.page.count` | {count, plural, one {# project} other {# projects}} |
| `career.portfolio.page.share` | Share |
| `career.portfolio.page.shareCopied` | Link copied |

### `certificate`

| Clé | Texte |
|---|---|
| `certificate.verify.title` | Certificate verification |
| `certificate.verify.seo.title` | Certificate verification · Jumanly |
| `certificate.verify.seo.description` | Check that a Jumanly course certificate is genuine using its number. |
| `certificate.verify.intro` | Enter the number shown on the certificate to check that it was issued by Jumanly. |
| `certificate.verify.form.label` | Certificate number |
| `certificate.verify.form.placeholder` | E.g.: JMN-XXXX-XXXX |
| `certificate.verify.form.submit` | Verify |

### `talent`

| Clé | Texte |
|---|---|
| `talent.profile.visibility.private.text` | Private |
| `talent.profile.visibility.recruiters.text` | Visible to recruiters |
| `talent.profile.visibility.anonymous.text` | Anonymous |

### `settings`

| Clé | Texte |
|---|---|
| `settings.privacy.ai.matching.text` | Calculate my match with offers |

### `org`

| Clé | Texte |
|---|---|
| `org.verification.badge.tooltip` | Jumanly has verified that this organization exists and the role of the person who manages it. |

### `ai`

| Clé | Texte |
|---|---|
| `ai.card.ignore` | Ignore |
| `ai.dispute.cta` | Report an error |

### `match`

| Clé | Texte |
|---|---|
| `match.score.value` | {score}% |
| `match.score.compact` | {score}% match |
| `match.band.veryHigh.text` | Very good match |
| `match.band.veryHigh.range` | 85 to 100 |
| `match.band.high.text` | Good match |
| `match.band.high.range` | 70 to 84 |
| `match.band.partial.text` | Partial match |
| `match.band.partial.range` | 50 to 69 |
| `match.band.low.text` | Weak match |
| `match.band.low.range` | Under 50 |
| `match.criterion.requiredSkills.text` | Required skills |
| `match.criterion.preferredSkills.text` | Preferred skills |
| `match.criterion.experience.text` | Experience |
| `match.criterion.languages.text` | Languages |
| `match.criterion.weight` | Weight: {weight}% |
| `match.criterion.status.met` | Met |
| `match.criterion.status.partial` | Partly met |
| `match.why.talent.title` | Why {score}%? |
| `match.why.talent.intro` | Your score is the sum of eight criteria, weighted by the recruiter. Here are the details for “{jobTitle}”. |
| `match.why.talent.met.title` | What matches |
| `match.why.talent.met.item.skillVerified` | {skill}: confirmed by your Jumanly certificate |
| `match.why.talent.met.item.experience` | {years, plural, one {# year} other {# years}} of experience for {min} required |
| `match.why.talent.met.item.language` | {language} {level} |
| `match.why.talent.met.item.location` | Compatible location: {city} · {workMode} |
| `match.why.talent.partial.title` | What partly matches |
| `match.why.talent.partial.item.language` | {language}: {expected} expected, you state {actual} |
| `match.why.talent.missing.title` | Missing skills |
| `match.why.talent.missing.preferred` | Preferred: {skill} |
| `match.why.talent.courses.title` | Jumanly courses to close the gap |
| `match.why.talent.courses.item` | “{courseTitle}” · {hours} h |
| `match.why.talent.courses.impact` | Your score would rise to {newScore}% |
| `match.why.talent.courses.included` | Included in your plan |
| `match.why.talent.courses.cta` | See the course |
| `match.why.talent.reportError` | Does the score look wrong? Report an error |
| `match.why.recruiter.title` | Why {score}% for {candidateName}? |
| `match.why.recruiter.rule` | AI ranks and explains, you decide. A score alone never justifies a decision. |

### `matchingPage`

| Clé | Texte |
|---|---|
| `matchingPage.meta.title` | How matching works · Jumanly |
| `matchingPage.meta.description` | The Jumanly match score explained simply: the criteria, the weights, what the AI never uses, and your right to a human review. |
| `matchingPage.title` | How matching works |
| `matchingPage.lead` | On Jumanly, AI recommends and people decide. Here is, in plain language, how we calculate the match between a talent and an offer. |
| `matchingPage.panel.title` | How matching works |
| `matchingPage.panel.readMore` | Read the full explanation |
| `matchingPage.s1.title` | 1. A score from 0 to 100 |
| `matchingPage.s1.body` | For each offer, we compare the recruiter's needs with your profile. The result is a score from 0 to 100. The higher it is, the more your profile fits what the offer asks for. |
| `matchingPage.s2.title` | 2. Eight criteria, and only those |
| `matchingPage.s2.body` | The score adds up eight criteria related to the job: |
| `matchingPage.s2.list.1` | required skills; |
| `matchingPage.s2.list.2` | preferred skills; |
| `matchingPage.s2.list.3` | experience; |
| `matchingPage.s2.list.4` | location and remote work; |
| `matchingPage.s2.list.5` | contract type and availability; |
| `matchingPage.s2.list.6` | languages; |
| `matchingPage.s2.list.7` | education or degree; |
| `matchingPage.s2.list.8` | how close your profile is to the job description. |
| `matchingPage.s3.title` | 3. Weights chosen by the recruiter |
| `matchingPage.s3.body` | Each criterion counts for a share of the score. The recruiter can give more weight to what really matters for the job. These weights are shown in the score explanation. |
| `matchingPage.s3.example` | Fictional example · Junior data analyst, Baobab Fintech |
| `matchingPage.s4.title` | 4. Four easy-to-read levels |
| `matchingPage.s4.veryHigh` | 85 to 100: Very good match |
| `matchingPage.s4.high` | 70 to 84: Good match |
| `matchingPage.s4.partial` | 50 to 69: Partial match |
| `matchingPage.s4.low` | Under 50: Weak match |
| `matchingPage.s4.note` | A low score is not a rejection. You can always apply, for free. |
| `matchingPage.s5.title` | 5. A “Why?” on every score |
| `matchingPage.s5.body` | Every score comes with an explanation: the criteria met, those partly met, the missing skills, and the Jumanly courses that can close the gap. |
| `matchingPage.s5.example` | Fictional example: Grâce Mbuyi, Pro talent in Kinshasa. |
| `matchingPage.s5.imageAlt` | Example explanation of an 87% score, with the criteria met, the missing skills and a course to close the gap |
| `matchingPage.s6.title` | 6. What we never use |
| `matchingPage.s6.body` | This information is never taken into account in the score, or in any suggestion: |
| `matchingPage.s6.list.1` | gender; |
| `matchingPage.s6.list.2` | age; |
| `matchingPage.s6.list.3` | photo; |
| `matchingPage.s6.list.4` | origin; |
| `matchingPage.s6.list.5` | religion; |
| `matchingPage.s6.list.6` | family situation; |
| `matchingPage.s6.list.7` | health. |
| `matchingPage.s6.plan` | Your Jumanly plan is not taken into account either: a Free profile is hired just like a subscriber. |
| `matchingPage.s7.title` | 7. AI rejects no one |
| `matchingPage.s7.body` | Matching ranks and explains. It never rules out an application. If an offer sets knockout criteria (for example a degree required by law), they are shown on the offer; a candidate who does not meet them is flagged to the recruiter, never rejected automatically. Every decision is made by a person. |
| `matchingPage.s8.title` | 8. You can challenge it |
| `matchingPage.s8.body` | If your score looks wrong, tap “Report an error” under the explanation. Someone from the Jumanly team checks the calculation and replies by e-mail. |
| `matchingPage.s9.title` | 9. You stay in control |
| `matchingPage.s9.body` | You can turn off the match calculation in your settings. You can still apply; the recruiter will see your application without a score. |
| `matchingPage.faq.title` | Frequently asked questions |
| `matchingPage.faq.q1` | Does paying for a plan improve my score? |
| `matchingPage.faq.a1` | No. The plan is not part of the calculation. Plans give access to tools to progress (courses, AI coach), which can help you strengthen your profile. |
| `matchingPage.faq.q2` | How can I improve my score? |
| `matchingPage.faq.a2` | Complete your profile, state the level of your skills and take the courses suggested in the “Why?”. Jumanly certificates make your skills verifiable. |
| `matchingPage.faq.q3` | Does the recruiter see my score? |
| `matchingPage.faq.a3` | Yes, with the same explanation as you. It helps them prioritize, not decide for you. |
| `matchingPage.faq.q4` | Who can contact me through matching? |
| `matchingPage.faq.a4` | Only the recruiters of the offers you apply to, or those whose introduction request you accept if your profile is visible in the talent pool. |
| `matchingPage.faq.eyebrow` | FAQ |
| `matchingPage.contact` | A question about matching? Write to us at assistant@jumanly.io or infojumanly@gmail.com. |
| `matchingPage.cta` | Create my profile for free |
| `matchingPage.eyebrow` | Jumanly Intelligence |
| `matchingPage.nav.label` | Contents |
| `matchingPage.nav.s1` | 1. A score from 0 to 100 |
| `matchingPage.nav.s2` | 2. Eight criteria |
| `matchingPage.nav.s6` | 6. What we never use |
| `matchingPage.nav.s8` | 8. You can challenge it |
| `matchingPage.hero.imageAlt` | Example match score: 87%, very good match |
| `matchingPage.example.job` | Junior data analyst |
| `matchingPage.example.company` | Baobab Fintech |
| `matchingPage.example.skill` | SQL |
| `matchingPage.example.language` | French |
| `matchingPage.example.languageLevel` | C2 |
| `matchingPage.example.city` | Kinshasa |
| `matchingPage.example.workMode` | Hybrid |
| `matchingPage.example.partialLanguage` | English |
| `matchingPage.example.partialExpected` | B2 |
| `matchingPage.example.partialActual` | B1 |
| `matchingPage.example.missingSkill` | Power BI |
| `matchingPage.example.course` | Dashboards with Power BI |
| `matchingPage.finalCta.title` | On Jumanly, AI recommends and people decide. |
