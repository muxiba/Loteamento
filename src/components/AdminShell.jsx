import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Trees,LayoutGrid,Users,Map,Images,FileText,SlidersHorizontal,Wallet,Receipt,Contact,ArrowUpRight,LogOut,RefreshCw,Menu,X,ChevronRight} from 'lucide-react';
import '../admin.css';
const sections=[
 {id:'crm',label:'Lotes',icon:LayoutGrid,group:'OPERAÇÃO',title:'Seus lotes, em um só lugar',description:'Consulte a disponibilidade e mantenha os dados de cada unidade organizados.'},
 {id:'approvals',label:'Cadastros e acessos',icon:Users,title:'Cadastros e acessos',description:'Analise as propostas recebidas e acompanhe os acessos dos clientes.'},
 {id:'finance',label:'Financeiro',icon:Wallet,title:'Visão financeira',description:'Consulte valores dos lotes, pagamentos e comprovantes por cliente.'},
 {id:'boletos',label:'Boletos e parcelas',icon:Receipt,title:'Boletos e parcelas',description:'Selecione uma unidade para enviar boletos e conferir pagamentos.'},
 {id:'site',label:'Planta do loteamento',icon:Map,group:'EMPREENDIMENTO',title:'Planta do loteamento',description:'Organize as áreas interativas que aparecem no site público.'},
 {id:'galeria',label:'Fotos e vídeos',icon:Images,title:'Galeria do empreendimento',description:'Gerencie os materiais publicados no site e no portal.'},
 {id:'copywriting',label:'Conteúdo do site',icon:FileText,title:'Conteúdo do site',description:'Atualize a apresentação do Reserva do Rio.'},
 {id:'brokers',label:'Corretores',icon:Contact,title:'Equipe de corretores',description:'Mantenha os contatos da equipe comercial atualizados.'},
 {id:'simconfig',label:'Condições de venda',icon:SlidersHorizontal,group:'CONFIGURAÇÕES',title:'Condições de venda',description:'Configure entrada, parcelamento e parâmetros das novas simulações.'},
];
export default function AdminShell({activeTab,onNavigate,onLogout,onRefresh,lots,pendingCount,approvedCount,loading,error,reviewCount=0,children}) {
 const [menuOpen,setMenuOpen]=useState(false);
 const [refreshing,setRefreshing]=useState(false);
 const current=sections.find(s=>s.id===activeTab)||sections[0];
 const available=lots.filter(l=>l.status==='Disponível').length;
 const sold=lots.filter(l=>l.status==='Vendido').length;
 const refresh=async()=>{setRefreshing(true);try{await onRefresh();}finally{setRefreshing(false);}};
 return <div className="admin-app">
  {menuOpen&&<button className="admin-scrim" aria-label="Fechar menu" onClick={()=>setMenuOpen(false)}/>}
  <aside className={`admin-sidebar ${menuOpen?'is-open':''}`}>
   <Link to="/" className="admin-brand"><span className="admin-brand-icon"><Trees size={26}/></span><span>Reserva do Rio<small>PAINEL ADMINISTRATIVO</small></span></Link>
   <div className="admin-workspace-label"><span className="admin-status-dot"/>Gestão do empreendimento</div>
   <nav aria-label="Administração">{sections.map(({id,label,icon:Icon,group})=><div key={id}>{group&&<p className="admin-nav-group">{group}</p>}<button type="button" aria-current={activeTab===id?'page':undefined} className={activeTab===id?'is-active':''} onClick={()=>{onNavigate(id);setMenuOpen(false);}}><Icon size={19}/><span>{label}</span>{id==='approvals'&&pendingCount>0&&<b className="admin-nav-count">{pendingCount}</b>}</button></div>)}</nav>
   <div className="admin-sidebar-footer"><Link to="/" target="_blank" rel="noopener noreferrer">Abrir site <ArrowUpRight size={16}/></Link><button onClick={onLogout}><LogOut size={17}/>Sair da conta</button></div>
  </aside>
  <div className="admin-main">
   <header className="admin-topbar"><div className="admin-breadcrumb"><button className="admin-mobile-menu" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X size={21}/>:<Menu size={21}/>}</button><span>Administração</span><ChevronRight size={14}/><strong>{current.label}</strong></div><div className="admin-account"><span>RR</span><div>Administrador<small>Acesso restrito</small></div></div></header>
   <main className="admin-workspace" id="admin-conteudo">
    <div className="admin-page-heading"><div><p className="admin-kicker">RESERVA DO RIO</p><h1>{current.title}</h1><p>{current.description}</p></div><button className="admin-refresh" disabled={refreshing} onClick={refresh}><RefreshCw size={16} className={refreshing?'is-spinning':''}/>{refreshing?'Atualizando…':'Atualizar dados'}</button></div>
    <section className="admin-metrics" aria-label="Resumo do empreendimento">{[
     {name:'Lotes cadastrados',value:lots.length,note:'Unidades no empreendimento',icon:LayoutGrid},
     {name:'Disponíveis',value:available,note:'Para novas propostas',icon:Trees},
     {name:'Vendidos',value:sold,note:'Conforme cadastro dos lotes',icon:Wallet},
     {name:'Cadastros pendentes',value:pendingCount,note:`${approvedCount} acessos liberados`,icon:Users},
    ].map(({name,value,note,icon:Icon})=><div className="admin-metric" key={name}><div><span>{name}</span><Icon size={19}/></div><strong>{loading?'—':value}</strong><small>{note}</small></div>)}</section>
    {error&&<div className="admin-error" role="alert">{error}<button onClick={refresh}>Tentar novamente</button></div>}
    {reviewCount>0&&<div className="admin-note">{reviewCount} cadastro(s) aprovado(s) estão vinculados a lotes marcados como disponíveis ou reservados. Confira a situação em Cadastros e acessos antes de disponibilizar essas unidades.</div>}
    <div className="admin-content">{children}</div>
   </main>
  </div>
 </div>;
}
