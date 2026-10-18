export function normalizeLot(lot) {
 const docs=lot.administrative_docs || {};
 return {...lot,clientCpf:lot.client_cpf || '',clientPhone:lot.client_phone || docs.clientPhone || '',simulation:lot.client_simulation || docs.simulation || lot.simulation,totalParcelas:lot.client_total_parcelas || lot.totalParcelas};
}
export function filterAdminLots(lots,search='',status='Todos') {
 const needle=search.trim().toLocaleLowerCase('pt-BR');
 return lots.filter(lot=>(status==='Todos'||lot.status===status)&&[lot.id,lot.client,lot.client_cpf].some(value=>String(value||'').toLocaleLowerCase('pt-BR').includes(needle)))
  .sort((a,b)=>String(a.id).localeCompare(String(b.id),'pt-BR',{numeric:true}));
}
export function hasClient(lot) { return lot.status==='Vendido' || Boolean(lot.client && lot.client.trim()!=='-'); }
export function enrichAdminLots(lots,users) {
 return lots.map(lot=>{
  const user=users.find(u=>u.lote_id===lot.id && u.status==='approved');
  if(!user)return normalizeLot(lot);
  return {...normalizeLot(lot),client:lot.client && lot.client!=='-'?lot.client:user.name,clientCpf:lot.client_cpf || user.cpf,clientPhone:user.telefone || lot.administrative_docs?.clientPhone || '',simulation:user.simulation || lot.administrative_docs?.simulation,totalParcelas:user.total_parcelas || lot.totalParcelas};
 });
}
export function paymentAmount(lot,index) {
 const sim=lot.simulation || lot.administrative_docs?.simulation || {};
 const initial=sim.parcelaInicial ?? (Number(lot.price || 0)/Number(lot.totalParcelas || 120));
 const rate=sim.taxa ?? 0.06;
 return Number(initial)*Math.pow(1+Number(rate),Math.floor(index/12));
}
