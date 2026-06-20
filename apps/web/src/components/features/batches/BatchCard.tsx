export function BatchCard({ batch }: { batch: { id: string; name: string } }) {
  return <div className="batch-card">{batch.name}</div>;
}
