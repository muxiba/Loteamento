export async function api(path, options={}) {
 const response=await fetch('/api/'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});
 const data=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}));
 if(!response.ok)throw new Error(data.error || 'Não foi possível concluir a operação.');
 return data;
}
export const loginAccount=(type,login,password)=>api('auth/login',{method:'POST',body:{type,login,password}});
export const logoutAccount=()=>api('auth/logout',{method:'POST',body:{}});
export const getSession=()=>api('session');
export const getAccount=()=>api('account');
export const submitPaymentProof=(id,index,file)=>api('lots/'+encodeURIComponent(id)+'/proof',{method:'POST',body:{index,...file}});
export const submitClientDocument=(id,file)=>api('lots/'+encodeURIComponent(id)+'/documents',{method:'POST',body:file});
export async function uploadFile(file,purpose='document',lotId=null) {
 const signed=await api('uploads',{method:'POST',body:{name:file.name || 'arquivo',contentType:file.type,size:file.size,purpose,lotId}});
 const response=await fetch(signed.url,{method:'PUT',headers:{'Content-Type':file.type},body:file});
 if(!response.ok)throw new Error('Falha ao transferir o arquivo.');
 return api('uploads/'+signed.id,{method:'POST',body:{}});
}
export async function uploadDataUrl(url,name,lotId=null,purpose='document') {
 const blob=await (await fetch(url)).blob();
 return uploadFile(new File([blob],name,{type:blob.type}),purpose,lotId);
}
export async function externalizeFiles(value,lotId,name='documento') {
 if(typeof value==='string' && value.startsWith('data:'))return (await uploadDataUrl(value,name,lotId)).url;
 if(Array.isArray(value))return Promise.all(value.map(item=>externalizeFiles(item,lotId,name)));
 if(value && typeof value==='object')return Object.fromEntries(await Promise.all(Object.entries(value).map(async([key,item])=>[key,await externalizeFiles(item,lotId,value.name || value.boletoName || name)])));
 return value;
}
