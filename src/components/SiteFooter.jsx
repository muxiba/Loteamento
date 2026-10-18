import { Link } from 'react-router-dom';
import { Waves, ArrowUpRight } from 'lucide-react';
export default function SiteFooter() {
 return <footer className="site-footer"><div className="footer-top"><div><a className="site-brand" href="#conteudo"><Waves size={30} /><span>Reserva do Rio<small>ESPA�O PARA UMA NOVA HIST�RIA</small></span></a><p>Conhe�a. Escolha. Planeje seu pr�ximo passo.</p></div><nav aria-label="Links do rodap�"><a href="#mapa">Explore os lotes <ArrowUpRight size={14} /></a><a href="#pagamento">Simule seu plano <ArrowUpRight size={14} /></a><Link to="/cliente">�rea do cliente <ArrowUpRight size={14} /></Link></nav></div><div className="footer-bottom"><span>� {new Date().getFullYear()} Reserva do Rio � IADATA LTDA</span><span>Disponibilidade e condi��es sujeitas � confirma��o.</span><Link to="/admin">Administra��o</Link></div></footer>;
}
