interface DataTableProps {
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
}

export function DataTable({ columns, data }: DataTableProps) {
  return (
    <table>
      <thead>
        <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>{columns.map((col) => <td key={col.key}>{String(row[col.key] ?? '')}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
