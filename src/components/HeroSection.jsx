import { ArrowDown, ArrowUpRight, Map, Calculator, Trees } from 'lucide-react';
export default function HeroSection() {
 return <section className="hero new-hero" aria-labelledby="hero-title">
  <div className="hero-content"><span className="eyebrow light">RESERVA DO RIO</span>
   <h1 id="hero-title">Um novo lugar.<br /><em>Um outro ritmo.</em></h1>
   <p>Encontre seu espaço perto da natureza. Explore o loteamento, compare os lotes e planeje sua próxima conquista.</p>
   <div className="hero-actions"><a href="#mapa" className="btn btn-primary">Encontre seu lote <ArrowUpRight size={19} /></a><a href="#pagamento" className="hero-secondary">Simular pagamento <ArrowUpRight size={18} /></a></div>
  </div>
  <div className="hero-bottom"><span><Trees size={18} /> Mais espaço para viver</span><span><Map size={18} /> Conheça a planta</span><span><Calculator size={18} /> Planeje a compra</span><a href="#sobre" aria-label="Conhecer o empreendimento"><ArrowDown size={22} /></a></div>
 </section>;
}
