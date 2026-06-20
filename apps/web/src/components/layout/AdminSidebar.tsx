export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <nav>
        <ul>
          <li><a href="/admin/dashboard">Dashboard</a></li>
          <li><a href="/admin/batches">Batches</a></li>
          <li><a href="/admin/live-sessions">Live Sessions</a></li>
          <li><a href="/admin/videos">Videos</a></li>
          <li><a href="/admin/tests">Tests</a></li>
          <li><a href="/admin/attendance">Attendance</a></li>
        </ul>
      </nav>
    </aside>
  );
}
