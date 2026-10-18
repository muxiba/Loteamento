import { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight, Play, FileText, LoaderCircle } from 'lucide-react';
import VideoPreview from './VideoPreview';
import { getGalleryItems } from '../services/galleryService';

export default function MediaGallery() {
 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);
 const [selected, setSelected] = useState(null);
 const [videoLoading, setVideoLoading] = useState(false);
 const [videoError, setVideoError] = useState(false);
 const player = useRef(null);
 const [limit, setLimit] = useState(6);
 const dialog = useRef(null);
 const load = async () => {
  setLoading(true); setError(false);
  try { setItems(await getGalleryItems() || []); } catch { setError(true); } finally { setLoading(false); }
 };
 useEffect(() => { load(); }, []);
 const isVideo = item => item?.type === 'localVideo' || (item?.type === 'video' && item.url?.startsWith('/api/files/'));
 const mediaTitle = (item, index) => item.caption || (isVideo(item) ? `Vídeo do empreendimento ${index + 1}` : item.type === 'pdf' ? 'Documento do empreendimento' : `Reserva do Rio · imagem ${index + 1}`);
 const open = item => { setVideoError(false); setVideoLoading(isVideo(item)); setSelected(item); dialog.current?.showModal(); };
 const close = () => { player.current?.pause(); setSelected(null); setVideoLoading(false); };
 const safeUrl = url => typeof url === 'string' && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url));
 const visible = items.filter(item => safeUrl(item.url));
 return <section id="galeria" className="media-section">
  <div className="section-heading"><div><span className="eyebrow">CONHEÇA DE PERTO</span><h2>Imagine os seus<br />dias por aqui.</h2></div><p>Explore as imagens, os vídeos e os materiais do empreendimento. Um primeiro olhar sobre seu próximo lugar.</p></div>
  {loading ? <p className="data-message" role="status">Carregando a galeria…</p> : error ? <div className="data-message" role="alert"><p>Não foi possível carregar a galeria.</p><button className="btn btn-primary" onClick={load}>Tentar novamente</button></div> : !visible.length ? <p className="data-message">Novas imagens do empreendimento serão disponibilizadas em breve.</p> : <>
   <div className="media-grid">{visible.slice(0, limit).map((item, index) => <button key={item.id} className="media-tile" onClick={() => open(item)} aria-label={`Abrir ${mediaTitle(item, index)}`}>
    {isVideo(item) ? <VideoPreview url={item.url} /> : item.type === 'image' || !item.type ? <img src={item.url} alt={mediaTitle(item, index)} loading="lazy" decoding="async" /> : <div className="media-placeholder">{item.type === 'pdf' ? <FileText size={40} /> : <Play size={40} />}<span>{mediaTitle(item, index)}</span></div>}
    <span className="media-caption">{item.caption || (item.type === 'pdf' ? 'Consultar documento' : item.type === 'localVideo' || item.type === 'video' ? 'Assistir ao vídeo' : 'Conheça o empreendimento')}<ArrowUpRight size={20} /></span>
   </button>)}</div>
   {limit < visible.length && <div className="gallery-more"><button className="outline-button" onClick={() => setLimit(limit + 6)}>Ver mais imagens e materiais ({visible.length - limit})</button></div>}
  </>}
  <dialog ref={dialog} className="media-dialog" aria-label="Material do empreendimento" onClose={close}><div className="map-topline"><strong>{selected ? mediaTitle(selected, items.indexOf(selected)) : 'Reserva do Rio'}</strong><button onClick={() => dialog.current?.close()} aria-label="Fechar galeria"><X size={22} /></button></div>
   {selected && (selected.type === 'image' || !selected.type ? <img className="media-full" src={selected.url} alt={selected.caption || 'Empreendimento Reserva do Rio'} /> : isVideo(selected) ? <div className="video-player-wrap"><video key={selected.id} ref={player} className="media-full" src={selected.url} controls playsInline autoPlay preload="auto" onCanPlay={() => setVideoLoading(false)} onPlaying={() => setVideoLoading(false)} onWaiting={() => setVideoLoading(true)} onError={() => {setVideoLoading(false); setVideoError(true);}} />{videoLoading && !videoError && <div className="video-loading" role="status"><LoaderCircle size={28} /><span>Preparando vídeo…</span></div>}{videoError && <div className="data-message" role="alert"><p>Não foi possível reproduzir este vídeo.</p><button className="outline-button" onClick={() => {setVideoError(false); setVideoLoading(true); player.current?.load();}}>Tentar novamente</button></div>}</div> : <div className="data-message"><a className="btn btn-primary" href={selected.url} target="_blank" rel="noopener noreferrer">{selected.type === 'pdf' ? 'Abrir documento' : 'Abrir vídeo'} <ArrowUpRight size={18} /></a></div>)}
  </dialog>
 </section>;
}
