import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { CATEGORIES, courses, getCourse } from "@/lib/courses";
import { CourseCard } from "@/components/CourseCard";
import { LogoMark } from "@/components/Logo";

const FIT_TEST_URL = "https://www.nurseswecare.org/booking-workingplace-request-form";
const FLAGSHIP_SLUG = "rn-respirator-fit-testing-train-the-trainer";

const STATS = [
  { value: String(courses.length), label: "Courses" },
  { value: String(courses.reduce((n, c) => n + c.learningHours, 0)), label: "Learning hours" },
  { value: `${Math.floor(courses.reduce((n, c) => n + c.learners, 0) / 1000)}k+`, label: "Nurses learning" },
  {
    value: (courses.reduce((n, c) => n + c.rating, 0) / courses.length).toFixed(1),
    label: "Average rating",
  },
];

const COMMUNITY = [
  {
    title: "Developed by RNs",
    body: "Every program is built and delivered by Registered and Occupational Health Nurses who fit test, teach and support teams every week.",
  },
  {
    title: "Aligned with standards",
    body: "Our respiratory protection education follows CSA Z94.4, so what you learn carries straight into your workplace program.",
  },
  {
    title: "Learning together",
    body: "NursesWeCare began with colleagues guiding fellow nurses and internationally educated nurses, and peer support is still at our heart.",
  },
];

export default function HomePage() {
  const featured = courses.filter((c) => c.featured);
  const flagship = getCourse(FLAGSHIP_SLUG)!;

  return (
    <>
      {/* Hero: a framed notice card on an airy blue wash, like the homepage. */}
      <section className="sky-wash px-4 py-14 sm:px-6 lg:py-20">
        <div className="notice-card mx-auto max-w-4xl animate-fade-up px-6 py-10 text-center sm:px-12">
          <p className="caps text-xs font-bold text-accent">Welcome to the Academy</p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
            NursesWeCare Academy
          </h1>
          <p className="mt-3 font-display text-lg italic text-brand-dark sm:text-xl">
            Occupational Health and Respiratory Protection Education
          </p>
          <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-muted">
            Programs developed and delivered by Registered Nurses who are dedicated to advancing
            respiratory protection education and occupational health practices. Learn online,
            practise hands-on in Hamilton, and bring what you learn back to your team.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/courses" className="btn-outline-sky px-6 py-3 text-sm">
              Browse Courses
            </Link>
            <Link href={`/courses/${FLAGSHIP_SLUG}`} className="btn-outline-sky px-6 py-3 text-sm">
              RN Train-the-Trainer Program
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-4xl text-center">
          <h2 className="text-glow font-sans text-3xl font-light text-sky-deep sm:text-4xl">
            Occupational Health Nursing Education
          </h2>
          <p className="mt-2 text-lg">By The NursesWeCare Team</p>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-md bg-white/80 px-4 py-5 shadow-sm">
                <dd className="font-display text-3xl font-bold text-brand-dark">{s.value}</dd>
                <dt className="caps mt-1 text-[10px] font-bold text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Pink quote banner with the white logo mark. */}
      <section className="pink-wash relative overflow-hidden px-4 py-16 text-center text-white sm:px-6">
        <LogoMark tone="white" className="mx-auto h-24 w-28" />
        <p className="mx-auto mt-6 max-w-4xl font-caps text-2xl font-extrabold uppercase leading-snug tracking-[0.08em] drop-shadow-[0_2px_6px_rgba(201,71,159,0.5)] sm:text-4xl">
          &ldquo;Knowledge empowers us to make healthier choices, build stronger communities, and
          create a healthier future.&rdquo;
        </p>
      </section>

      {/* Flagship program, laid out like the program block on the homepage. */}
      <section className="bg-mist px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-stretch lg:grid-cols-[1fr_1.4fr]">
          <div className="cover-blend relative min-h-56 overflow-hidden rounded-t-md lg:rounded-l-md lg:rounded-tr-none">
            <div className="cover-pattern absolute inset-0" />
            <div className="relative flex h-full flex-col justify-end p-8 text-white">
              <p className="caps text-xs font-bold">Now enrolling</p>
              <p className="mt-2 font-display text-2xl font-bold">Group seats available for workplaces</p>
            </div>
          </div>
          <div className="rounded-b-md bg-white p-8 sm:p-10 lg:rounded-r-md lg:rounded-bl-none">
            <p className="text-4xl font-light text-sky-deep">NursesWeCare</p>
            <p className="mt-1 font-display text-lg italic">Occupational Health and Respiratory Protection Education</p>
            <h2 className="mt-6 text-lg font-bold">{flagship.title} Program</h2>
            <p className="text-muted">Offered by NursesWeCare Academy</p>
            <p className="mt-4 leading-relaxed text-muted">
              Designed to equip Registered Nurses with the knowledge and practical skills to conduct
              respirator fit testing safely and effectively in healthcare and workplace environments.
            </p>
            <p className="mt-4 font-semibold">The program integrates:</p>
            <ul className="mt-2 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
              {[
                "Aerosol science and airborne transmission",
                "Respirator technology and filtration",
                "Qualitative respirator fit testing",
                "Infection prevention and control",
                "Occupational health nursing considerations",
                "Adult learning principles",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href={`/courses/${FLAGSHIP_SLUG}`} className="btn-pink mt-8 px-6 py-3 text-sm">
              View Program Details <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold">Featured Courses</h2>
            <p className="mt-2 text-muted">Start with our most requested programs.</p>
          </div>
          <Link href="/courses" className="caps inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-dark">
            See all courses <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      {/* Vision and mission blocks, in the site's blue and pink. */}
      <section className="mt-20 grid md:grid-cols-2">
        <div className="flex min-h-64 flex-col items-center justify-center bg-sky px-8 py-14 text-center text-white">
          <h2 className="on-band font-display text-5xl">Vision</h2>
          <span className="mt-3 h-px w-10 bg-white" />
        </div>
        <div className="flex items-center px-8 py-14 sm:px-16">
          <p className="max-w-md text-lg leading-relaxed">
            To establish a reputable organization in advancing health, safety, and wellness, where
            workplaces are healthier, communities stronger, and nurses empowered to create lasting
            impact.
          </p>
        </div>
        <div className="order-4 flex items-center px-8 py-14 sm:px-16 md:order-3">
          <p className="max-w-md text-lg leading-relaxed">
            NursesWeCare provides evidence-based nursing services, occupational health programs, and
            community wellness initiatives that improve lives in workplaces and across communities.
            Through education, specialized clinical services, and partnerships, we support the next
            generation of nurses, individuals, and organizations to thrive in health and safety.
          </p>
        </div>
        <div className="order-3 flex min-h-64 flex-col items-center justify-center bg-pink px-8 py-14 text-center text-white md:order-4">
          <h2 className="on-pink font-display text-5xl">Mission</h2>
          <span className="mt-3 h-px w-10 bg-white" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 text-center sm:px-6">
        <span className="caps on-band inline-block rounded-xl bg-sky px-5 py-2 text-sm font-extrabold text-white">
          NursesWeCare
        </span>
        <h2 className="mt-4 font-caps text-3xl font-extrabold uppercase leading-tight text-accent sm:text-4xl">
          A Community of Caring &amp; Learning
        </h2>
        <div className="mt-4 flex justify-center gap-4" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-accent" />
          <span className="h-3 w-3 rounded-full bg-accent" />
          <span className="h-3 w-3 rounded-full bg-accent" />
        </div>
        <div className="mt-10 grid gap-6 text-left md:grid-cols-3">
          {COMMUNITY.map(({ title, body }) => (
            <div key={title} className="rounded-md bg-sky p-6 shadow-[0_6px_18px_-10px_rgba(47,147,207,0.8)]">
              <h3 className="on-band font-display text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#123f5e]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold">Explore by Topic</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => {
            const count = courses.filter((c) => c.category === cat).length;
            return (
              <Link
                key={cat}
                href={`/courses?category=${encodeURIComponent(cat)}`}
                className="btn-outline-sky px-5 py-3 text-sm"
              >
                {cat}
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent-dark">{count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pt-20 sm:px-6">
        <div className="notice-card px-6 py-10 text-center sm:px-12">
          <h2 className="font-display text-2xl font-bold">Need a Respirator Fit Test?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            NursesWeCare also offers N95 respirator fit testing for students and workplaces, at our
            Hamilton office and on site. Please arrive clean-shaven around the respirator sealing
            area so we can get a proper seal.
          </p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted">
            <MapPin className="h-4 w-4 text-accent" aria-hidden /> 702 Upper James St., Hamilton, ON
          </p>
          <a href={FIT_TEST_URL} target="_blank" rel="noreferrer" className="btn-outline-sky mt-6 px-6 py-3 text-sm">
            Book A Fit Test
          </a>
        </div>
      </section>
    </>
  );
}
