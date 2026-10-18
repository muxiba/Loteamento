import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Waves, ArrowUpRight } from 'lucide-react';
export default function SiteHeader() {
 const [open, setOpen] = useState(false);
 const close = () => setOpen(false);
 return <header className="site-header">
  <a className="skip-link" href="#conteudo">Pular para o conte�do</a>
  <Link to="/" className="site-brand" onClick={close}><Waves size={30} strokeWidth={1.5} /><span>Reserva do Rio<small>LOTEAMENTO RESIDENCIAL</small></span></Link>
  <button className="menu-toggle" aria-expanded={open} aria-controls="site-navigation" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  <nav id="site-navigation" className={open ? 'site-navigation is-open' : 'site-navigation'} aria-label="Navega��o principal" onKeyDown={e => { if (e.key === 'Escape') close(); }}>
   <a href="#sobre" onClick={close}>O empreendimento</a><a href="#mapa" onClick={close}>Escolha seu lote</a><a href="#galeria" onClick={close}>Galeria</a><a href="#pagamento" onClick={close}>Simule seu plano</a>
   <Link to="/cliente" className="header-client" onClick={close}>�rea do cliente <ArrowUpRight size={16} /></Link>
  </nav>
 </header>;
}
