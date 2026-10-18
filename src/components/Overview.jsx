import { Map, Trees, Calculator, ArrowUpRight } from 'lucide-react';
import landscape from '../assets/hero.png';
export default function Overview() {
 return <section id="sobre" className="overview-section">
  <div className="overview-photo"><img src={landscape} alt="Paisagem ilustrativa do Reserva do Rio" loading="lazy" /></div>
  <div className="overview-copy"><span className="eyebrow">MAIS PERTO DO QUE IMPORTA</span><h2>Espaço para os seus planos.<br /><em>Natureza para os seus dias.</em></h2><p>Conheça o Reserva do Rio no seu tempo. Da escolha do lote ao planejamento da compra, encontre as informações para dar o próximo passo.</p>
   <div className="overview-points"><div><Trees size={21} /><span><strong>Conheça o lugar</strong><small>Veja imagens e materiais do empreendimento.</small></span></div><div><Map size={21} /><span><strong>Compare suas opções</strong><small>Consulte a área, o valor e a disponibilidade dos lotes.</small></span></div><div><Calculator size={21} /><span><strong>Planeje o pagamento</strong><small>Explore as condições no simulador.</small></span></div></div>
   <a className="overview-link" href="#mapa">Encontre seu espaço <ArrowUpRight size={18} /></a>
  </div>
 </section>;
}
