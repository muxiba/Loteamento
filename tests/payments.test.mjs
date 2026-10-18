import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeAdminPayment} from '../server/payments.mjs';
test('confirmar pagamento preserva comprovante recém-enviado e parcelas vizinhas',()=>{
 const current=[{comprovanteUrl:'/api/files/proof',comprovanteName:'pix.pdf',quitado:false},{boletoName:'outra.pdf'}];
 const merged=mergeAdminPayment(current,0,{quitado:true,comprovanteUrl:'injetado'},2);
 assert.equal(merged[0].comprovanteUrl,'/api/files/proof');assert.equal(merged[0].quitado,true);assert.equal(current[0].quitado,false);assert.deepEqual(merged[1],current[1]);
});
test('excluir boleto conserva confirmação e comprovante, sem aceitar índices inválidos',()=>{
 const merged=mergeAdminPayment([{boletoUrl:'/api/files/old',quitado:true,comprovanteName:'pix.pdf'}],0,{boletoUrl:null},12);
 assert.equal(merged[0].boletoUrl,null);assert.equal(merged[0].quitado,true);assert.equal(merged[0].comprovanteName,'pix.pdf');
 assert.throws(()=>mergeAdminPayment([],12,{quitado:true},12));assert.throws(()=>mergeAdminPayment([],0,{quitado:'sim'},12));assert.throws(()=>mergeAdminPayment([],0,{boletoUrl:'https://example.com'},12));
});
