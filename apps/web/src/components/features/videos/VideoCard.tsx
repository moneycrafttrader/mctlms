export function VideoCard({ video }: { video: { id: string; title: string } }) {
  return <div className="video-card">{video.title}</div>;
}
