import { Breadcrumb } from "./Breadcrumb";

export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Breadcrumb items={[{ label: title }]} />
      <div className="page single">
        <main style={{ maxWidth: 820 }}>
          <div className="page-title">
            <h1>{title}</h1>
          </div>
          <div className="box">
            <div className="box-body">{children}</div>
          </div>
        </main>
      </div>
    </>
  );
}
