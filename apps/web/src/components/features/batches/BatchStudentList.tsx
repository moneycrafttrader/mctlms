export function BatchStudentList({ students }: { students: { id: string; name: string }[] }) {
  return (
    <ul>
      {students.map((s) => <li key={s.id}>{s.name}</li>)}
    </ul>
  );
}
