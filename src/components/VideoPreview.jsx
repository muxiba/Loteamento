import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
export default function VideoPreview({ url }) {
 const holder = useRef(null);
 const [visible, setVisible] = useState(false);
 useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
   if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
  }, { rootMargin: '100px' });
  if (holder.current) observer.observe(holder.current);
  return () => observer.disconnect();
 }, []);
 return <div ref={holder} className="video-preview">
  {visible && <video src={`${url}#t=0.1`} preload="metadata" muted playsInline aria-hidden="true" tabIndex={-1} />}
  <span className="video-play-badge"><Play size={30} fill="currentColor" strokeWidth={1.5} /></span>
  <span className="video-type-label">VÍDEO</span>
 </div>;
}
