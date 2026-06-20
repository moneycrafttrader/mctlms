export function PageHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="page-header">
      <h2>{title}</h2>
      {actions && <div>{actions}</div>}
    </div>
  );
}
