import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLot,enrichAdminLots,filterAdminLots,hasClient,paymentAmount} from '../src/lib/adminData.js';
test('cadastro legado conserva CPF, telefone e simulação do contrato aprovado',()=>{
 const original={id:'Lote 01',status:'Disponível',client:'-',client_cpf:'',price:'12000',totalParcelas:120,administrative_docs:{memorial:{url:'/api/files/example'}}};
 const [lot]=enrichAdminLots([original],[{status:'approved',lote_id:'Lote 01',name:'Cliente teste',cpf:'00000000000',telefone:'11900000000',simulation:{parcelaInicial:150,taxa:0},total_parcelas:60}]);
 assert.equal(lot.client,'Cliente teste');assert.equal(lot.clientCpf,'00000000000');assert.equal(lot.totalParcelas,60);assert.equal(paymentAmount(lot,24),150);assert.equal(lot.status,'Disponível');assert.equal(original.client,'-');assert.deepEqual(lot.administrative_docs,original.administrative_docs);
});
test('busca combina cliente, identificação e filtro com ordem natural',()=>{
 const lots=[{id:'Lote 10',client:'Cliente',status:'Vendido'},{id:'Lote 2',client:'Cliente',status:'Disponível'}];
 assert.deepEqual(filterAdminLots(lots,'cliente').map(l=>l.id),['Lote 2','Lote 10']);assert.equal(filterAdminLots(lots,'cliente','Vendido').length,1);
 assert.equal(hasClient({client:null,status:'Disponível'}),false);assert.equal(hasClient({client:'-',status:'Disponível'}),false);
});
test('financeiro usa a taxa contratada por ano e aceita taxa zero',()=>{
 assert.equal(paymentAmount({simulation:{parcelaInicial:100,taxa:0.1}},12),110.00000000000001);
 assert.equal(paymentAmount({simulation:{parcelaInicial:100,taxa:0}},24),100);
 assert.equal(normalizeLot({client_cpf:'123',administrative_docs:{clientPhone:'456'}}).clientPhone,'456');
});
