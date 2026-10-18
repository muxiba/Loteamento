import { Map, Trees, Calculator, ArrowUpRight } from 'lucide-react';
import landscape from '../assets/hero.png';
export default function Overview() {
 return <section id="sobre" className="overview-section">
  <div className="overview-photo"><img src={landscape} alt="Paisagem ilustrativa do Reserva do Rio" loading="lazy" /></div>
  <div className="overview-copy"><span className="eyebrow">MAIS PERTO DO QUE IMPORTA</span><h2>Espa�o para os seus planos.<br /><em>Natureza para os seus dias.</em></h2><p>Conhe�a o Reserva do Rio no seu tempo. Da escolha do lote ao planejamento da compra, encontre as informa��es para dar o pr�ximo passo.</p>
   <div className="overview-points"><div><Trees size={21} /><span><strong>Conhe�a o lugar</strong><small>Veja imagens e materiais do empreendimento.</small></span></div><div><Map size={21} /><span><strong>Compare suas op��es</strong><small>Consulte a �rea, o valor e a disponibilidade dos lotes.</small></span></div><div><Calculator size={21} /><span><strong>Planeje o pagamento</strong><small>Explore as condi��es no simulador.</small></span></div></div>
   <a className="overview-link" href="#mapa">Encontre seu espa�o <ArrowUpRight size={18} /></a>
  </div>
 </section>;
}
