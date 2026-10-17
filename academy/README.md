# NursesWeCare Academy (prototype)

A prototype of the online learning platform for NursesWeCare Academy, the
educational home of [NursesWeCare](https://www.nurseswecare.org/). It's a
standalone Next.js app that lives alongside BuildBrief in this repo and needs
no accounts, keys or database to run.

## Run it locally

```bash
cd academy
npm install
npm run dev
```

Then open [http://localhost:3100](http://localhost:3100).

## Pages

| Route | What's there |
| --- | --- |
| `/` | Academy home: mission, featured courses, topics and how it works |
| `/courses` | Course catalog with search, topic chips, level/format filters and sorting |
| `/courses/[slug]` | Course page: outcomes, curriculum, instructor and an enroll card |
| `/dashboard` | Learner dashboard: progress, CE hours, live sessions and certificates |

## Where things live

```
app/            Pages (App Router)
components/     Header, footer, course cards, catalog filters, curriculum
lib/courses.ts  Sample course catalog
lib/learner.ts  Sample learner, enrollments, sessions and certificates
```

All courses, instructors and learner data are sample placeholders, so swap in
the real catalog by editing `lib/courses.ts`.
