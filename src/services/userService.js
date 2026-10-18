import {api} from '../lib/api';
export const getUsers=status=>api('users?status='+encodeURIComponent(status));
export const updateUserStatus=(id,status)=>api('users/'+encodeURIComponent(id),{method:'PATCH',body:{status}});
export const createPendingUser=user=>api('users/register',{method:'POST',body:{name:user.name,cpf:user.cpf,email:user.email,telefone:user.telefone,password:user.password,simulation:user.simulation,profile:user.profile,lote_id:user.loteId,total_parcelas:user.totalParcelas}});
export const deleteUser=id=>api('users/'+encodeURIComponent(id),{method:'DELETE',body:{}});
