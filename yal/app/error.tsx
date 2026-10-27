"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page single">
      <main style={{ maxWidth: 720 }}>
        <div className="box">
          <div className="box-head">Something went wrong</div>
          <div className="box-body">
            <p className="mt-0">YAL hit a snag loading this page. Please try again.</p>
            <button type="button" className="btn primary" onClick={reset}>
              Try again
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
