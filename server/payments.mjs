import {HttpError} from './security.mjs';
export function mergeAdminPayment(current,index,changes,total) {
 if(!Number.isInteger(index)||index<0||index>=total)throw new HttpError(400,'Parcela inválida.');
 const allowed={};
 if(Object.hasOwn(changes,'quitado')){
  if(typeof changes.quitado!=='boolean')throw new HttpError(400,'Confirmação de pagamento inválida.');
  allowed.quitado=changes.quitado;
 }
 if(Object.hasOwn(changes,'boletoUrl')){
  if(changes.boletoUrl!==null&&!/^\/api\/files\/[a-f0-9-]{36}$/.test(String(changes.boletoUrl)))throw new HttpError(400,'Envie o boleto antes de anexá-lo.');
  allowed.boletoUrl=changes.boletoUrl;
  allowed.boletoName=changes.boletoUrl===null?null:String(changes.boletoName || 'Boleto.pdf').slice(0,240);
 }
 if(!Object.keys(allowed).length)throw new HttpError(400,'Nenhuma alteração de pagamento informada.');
 const payments=[...(current || [])];while(payments.length<=index)payments.push({});
 payments[index]={...payments[index],...allowed};return payments;
}
