import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function NotFound() {
  return (
    <>
      <Breadcrumb items={[{ label: "Page not found" }]} />
      <div className="page single">
        <main style={{ maxWidth: 720 }}>
          <div className="box">
            <div className="box-head">404 &mdash; Page not found</div>
            <div className="box-body">
              <p className="mt-0">The page you were looking for doesn&apos;t exist, or it doesn&apos;t exist at this point in time.</p>
              <p>
                <Link href="/" className="btn">
                  &laquo; Back to YourAnimeList
                </Link>{" "}
                <Link href="/search" className="btn">
                  Search
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
