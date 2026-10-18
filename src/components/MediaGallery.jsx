import { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight, Play, FileText } from 'lucide-react';
import { getGalleryItems } from '../services/galleryService';

export default function MediaGallery() {
 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);
 const [selected, setSelected] = useState(null);
 const [limit, setLimit] = useState(6);
 const dialog = useRef(null);
 const load = async () => {
  setLoading(true); setError(false);
  try { setItems(await getGalleryItems() || []); } catch { setError(true); } finally { setLoading(false); }
 };
 useEffect(() => { load(); }, []);
 const open = item => { setSelected(item); dialog.current?.showModal(); };
 const safeUrl = url => typeof url === 'string' && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url));
 const visible = items.filter(item => safeUrl(item.url));
 return <section id="galeria" className="media-section">
  <div className="section-heading"><div><span className="eyebrow">CONHE�A DE PERTO</span><h2>Imagine os seus<br />dias por aqui.</h2></div><p>Explore as imagens, os v�deos e os materiais do empreendimento. Um primeiro olhar sobre seu pr�ximo lugar.</p></div>
  {loading ? <p className="data-message" role="status">Carregando a galeria.</p> : error ? <div className="data-message" role="alert"><p>N�o foi poss�vel carregar a galeria.</p><button className="btn btn-primary" onClick={load}>Tentar novamente</button></div> : !visible.length ? <p className="data-message">Novas imagens do empreendimento ser�o disponibilizadas em breve.</p> : <>
   <div className="media-grid">{visible.slice(0, limit).map((item, index) => <button key={item.id} className="media-tile" onClick={() => open(item)} aria-label={`Abrir ${item.caption || item.name || `imagem ${index + 1}`}`}>
    {item.type === 'image' || !item.type ? <img src={item.url} alt={item.caption || `Reserva do Rio � imagem ${index + 1}`} loading="lazy" decoding="async" /> : <div className="media-placeholder">{item.type === 'pdf' ? <FileText size={40} /> : <Play size={40} />}<span>{item.name || (item.type === 'pdf' ? 'Documento do empreendimento' : 'V�deo do empreendimento')}</span></div>}
    <span className="media-caption">{item.caption || (item.type === 'pdf' ? 'Consultar documento' : item.type === 'localVideo' || item.type === 'video' ? 'Assistir ao v�deo' : 'Conhe�a o empreendimento')}<ArrowUpRight size={20} /></span>
   </button>)}</div>
   {limit < visible.length && <div className="gallery-more"><button className="outline-button" onClick={() => setLimit(limit + 6)}>Ver mais imagens e materiais ({visible.length - limit})</button></div>}
  </>}
  <dialog ref={dialog} className="media-dialog" aria-label="Material do empreendimento" onClose={() => setSelected(null)}><div className="map-topline"><strong>{selected?.caption || selected?.name || 'Reserva do Rio'}</strong><button onClick={() => dialog.current?.close()} aria-label="Fechar galeria"><X size={22} /></button></div>
   {selected && (selected.type === 'image' || !selected.type ? <img className="media-full" src={selected.url} alt={selected.caption || 'Empreendimento Reserva do Rio'} /> : selected.type === 'localVideo' ? <video className="media-full" src={selected.url} controls playsInline /> : <div className="data-message"><a className="btn btn-primary" href={selected.url} target="_blank" rel="noopener noreferrer">{selected.type === 'pdf' ? 'Abrir documento' : 'Abrir v�deo'} <ArrowUpRight size={18} /></a></div>)}
  </dialog>
 </section>;
}
