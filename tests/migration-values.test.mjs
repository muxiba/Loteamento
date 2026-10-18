import test from 'node:test';
import assert from 'node:assert/strict';
import {migrationValues} from '../scripts/migration-values.mjs';

test('importa��o preserva strings, objetos e arrays em colunas JSON', () => {
  for (const value of ['https://example.com/map.png', { rate: 0.1 }, [], false, 42, '']) {
    const result = migrationValues('config', { key: 'example', value });
    assert.equal(result[0], 'example');
    assert.deepEqual(JSON.parse(result[1]), value);
  }
});

test('importa��o mant�m SQL NULL e texto comum sem serializa��o JSON', () => {
  assert.deepEqual(migrationValues('users', { name: 'Teste', profile: null, simulation: { months: 60 } }),
    ['Teste', null, '{"months":60}']);
  assert.deepEqual(migrationValues('lots', { id: '101', payments: [{ paid: false }], administrative_docs: {} }),
    ['101', '[{"paid":false}]', '{}']);
});
