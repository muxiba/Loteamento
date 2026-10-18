import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpRight, Maximize2, X, Map, List, RotateCw } from 'lucide-react';
import mapaPlanta from '../assets/planta.jpg';
import { useLotsSummary } from '../hooks/useLots';
import { getMappedLots } from '../services/mapService';
import { getConfig } from '../services/configService';
const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const available = lot => lot?.status === 'Dispon�vel';
const statusClass = status => ({ Vendido: 'sold', Reservado: 'reserved', 'Dispon�vel': 'available' }[status] || 'unknown');
export default function LotExplorer({ onSelectLotPrice }) {
 const { lots, loading, error, reload } = useLotsSummary();
 const [selectedId, setSelectedId] = useState(null);
 const [mappedLots, setMappedLots] = useState([]);
 const [mapImageUrl, setMapImageUrl] = useState(mapaPlanta);
 const [mapError, setMapError] = useState(false);
 const [search, setSearch] = useState('');
 const [filter, setFilter] = useState('Todos');
 const [sort, setSort] = useState('id');
 const [view, setView] = useState('map');
 const dialog = useRef(null);
 const navigate = useNavigate();
 useEffect(() => {
  let active = true;
  Promise.allSettled([getMappedLots(), getConfig('map_custom_url')]).then(([mapped, image]) => {
   if (!active) return;
   if (mapped.status === 'fulfilled') setMappedLots(mapped.value || []); else setMapError(true);
   if (image.status === 'fulfilled' && image.value) setMapImageUrl(image.value);
  });
  return () => { active = false; };
 }, []);
 const selected = lots.find(lot => lot.id === selectedId);
 const choose = lot => { setSelectedId(lot.id); if (available(lot)) onSelectLotPrice?.(lot); };
 const filtered = lots.filter(lot => (filter === 'Todos' || lot.status === filter) && String(lot.id).toLowerCase().includes(search.trim().toLowerCase()))
  .sort((a, b) => sort === 'price' ? Number(a.price) - Number(b.price) : String(a.id).localeCompare(String(b.id), 'pt-BR', { numeric: true }));
 const visibleIds = new Set(filtered.map(lot => lot.id));
 const counts = Object.fromEntries(['Dispon�vel', 'Reservado', 'Vendido'].map(status => [status, lots.filter(lot => lot.status === status).length]));
 const renderMap = expanded => <div className={expanded ? 'lot-map expanded-map' : 'lot-map'} style={{ backgroundImage: `url("${mapImageUrl}")` }}>
  {mappedLots.map(rect => {
   const lot = lots.find(item => item.id === rect.id);
   if (!lot) return null;
   return <button type="button" key={rect.id} className={`lot-marker ${statusClass(lot.status)} ${selectedId === lot.id ? 'selected' : ''}`}
    style={{ left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%`, opacity: visibleIds.has(lot.id) ? 1 : 0.18 }}
    onClick={() => choose(lot)} aria-label={`Lote ${lot.id}, ${lot.status}, ${money(lot.price)}`} aria-pressed={selectedId === lot.id} title={`Lote ${lot.id} � ${lot.status}`}>{lot.id}</button>;
  })}
  {!mappedLots.length && !loading && <p className="map-message">{mapError ? 'A planta interativa est� indispon�vel. Consulte os lotes na lista.' : 'Consulte as op��es na lista de lotes.'}</p>}
 </div>;
 return <section id="mapa" className="lot-section">
  <div className="section-heading"><div><span className="eyebrow">SEU PR�XIMO ENDERE�O</span><h2>Um espa�o que combina<br />com os seus planos.</h2></div><p>Compare �reas, valores e disponibilidade. Selecione um lote para conhecer os detalhes e simular seu pagamento.</p></div>
  <div className="inventory-stats" aria-label="Disponibilidade dos lotes">
   <div><strong>{loading ? '-' : lots.length}</strong><span>Lotes cadastrados</span></div>
   <div><strong>{loading ? '-' : counts['Dispon�vel']}</strong><span><i className="status-dot available" />Dispon�veis</span></div>
   <div><strong>{loading ? '-' : counts.Reservado}</strong><span><i className="status-dot reserved" />Reservados</span></div>
   <div><strong>{loading ? '-' : counts.Vendido}</strong><span><i className="status-dot sold" />Vendidos</span></div>
  </div>
  <div className="lot-toolbar">
   <label className="lot-search"><Search size={18} /><span className="sr-only">Buscar pelo n�mero do lote</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar n�mero do lote" type="search" /></label>
   <label><span className="sr-only">Filtrar disponibilidade</span><select value={filter} onChange={e => setFilter(e.target.value)}>{['Todos', 'Dispon�vel', 'Reservado', 'Vendido'].map(value => <option key={value}>{value}</option>)}</select></label>
   <label><span className="sr-only">Ordenar lotes</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="id">N�mero do lote</option><option value="price">Menor valor</option></select></label>
   <div className="view-toggle" aria-label="Visualiza��o"><button aria-pressed={view === 'map'} onClick={() => setView('map')}><Map size={18} /> Planta</button><button aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={18} /> Lista</button></div>
  </div>
  {loading ? <div className="data-message" role="status">Carregando os lotes.</div> : error ? <div className="data-message" role="alert"><h3>N�o foi poss�vel consultar os lotes.</h3><p>Tente novamente em instantes.</p><button className="btn btn-primary" onClick={reload}><RotateCw size={17} /> Tentar novamente</button></div> : <>
   <div className="lot-workspace"><div className="lot-canvas">
    {view === 'map' ? <><div className="map-topline"><span>Planta do empreendimento</span><button onClick={() => dialog.current?.showModal()}><Maximize2 size={15} /> Ampliar</button></div>{renderMap(false)}<p className="map-footnote">As cores indicam a disponibilidade. Consulte as dimens�es e a documenta��o do lote antes de contratar.</p></> :
     <div className="lot-grid">{filtered.map(lot => <button key={lot.id} className={`lot-card ${selectedId === lot.id ? 'is-selected' : ''}`} onClick={() => choose(lot)} aria-pressed={selectedId === lot.id}><span className={`status-chip ${statusClass(lot.status)}`}>{lot.status}</span><h3>Lote {lot.id}</h3><p>{lot.size || '�rea a consultar'}</p><strong>{money(lot.price)}</strong><span className="lot-card-link">Ver detalhes <ArrowUpRight size={16} /></span></button>)}{!filtered.length && <p className="data-message">Nenhum lote encontrado. Altere a busca ou o filtro.</p>}</div>}
   </div><aside className="lot-selection" aria-live="polite">
    {selected ? <><span className={`status-chip ${statusClass(selected.status)}`}>{selected.status}</span><h3>Lote {selected.id}</h3><p>{selected.desc || 'Conhe�a os detalhes deste lote e planeje sua compra.'}</p><dl><div><dt>�rea do lote</dt><dd>{selected.size || 'A consultar'}</dd></div><div><dt>Valor de tabela</dt><dd>{money(selected.price)}</dd></div></dl>{available(selected) ? <><a href="#pagamento" className="btn btn-primary" onClick={() => onSelectLotPrice?.(selected)}>Simular este lote <ArrowUpRight size={17} /></a><button className="lot-proposal" onClick={() => navigate('/proposta', { state: { lotId: selected.id } })}>Iniciar proposta</button></> : <p className="selection-notice">Este lote n�o est� dispon�vel para novas propostas. Escolha um lote dispon�vel para continuar.</p>}</> :
     <div className="selection-empty"><Map size={34} strokeWidth={1.3} /><h3>Seu lote come�a aqui.</h3><p>Selecione um lote na planta ou na lista para consultar a �rea, o valor e as op��es de pagamento.</p><button onClick={() => setView('list')}>Explorar a lista <ArrowUpRight size={16} /></button></div>}
   </aside></div><p className="lot-result-count" role="status">{filtered.length} {filtered.length === 1 ? 'lote encontrado' : 'lotes encontrados'} � Valores sujeitos � confirma��o.</p>
  </>}
  <dialog ref={dialog} className="map-dialog" aria-label="Planta ampliada"><div className="map-topline"><strong>Planta � Reserva do Rio</strong><button onClick={() => dialog.current?.close()} aria-label="Fechar planta ampliada"><X size={20} /></button></div>{renderMap(true)}{selected && <div className="expanded-selection">Lote {selected.id} � {selected.status} � {selected.size} � {money(selected.price)} <button onClick={() => dialog.current?.close()}>Ver detalhes</button></div>}</dialog>
 </section>;
}
