import { Link } from 'react-router-dom';
import { Waves, ArrowUpRight } from 'lucide-react';
export default function SiteFooter() {
 return <footer className="site-footer"><div className="footer-top"><div><a className="site-brand" href="#conteudo"><Waves size={30} /><span>Reserva do Rio<small>ESPAÇO PARA UMA NOVA HISTÓRIA</small></span></a><p>Conheça. Escolha. Planeje seu próximo passo.</p></div><nav aria-label="Links do rodapé"><a href="#mapa">Explore os lotes <ArrowUpRight size={14} /></a><a href="#pagamento">Simule seu plano <ArrowUpRight size={14} /></a><Link to="/cliente">Área do cliente <ArrowUpRight size={14} /></Link></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Reserva do Rio · IADATA LTDA</span><span>Disponibilidade e condições sujeitas à confirmação.</span><Link to="/admin">Administração</Link></div></footer>;
}
