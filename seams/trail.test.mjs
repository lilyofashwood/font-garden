import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSeam, decodeSeam } from './codec.mjs';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const seeds = read('seeds.json');
const packets = read('trail.json');

test('fourteen individually authored poems reproduce their exact published packets', () => {
  assert.equal(seeds.length, 14);
  assert.equal(new Set(seeds.map(seed => seed.id)).size, 14);
  assert.equal(new Set(seeds.map(seed => seed.carrier)).size, 14);
  assert.deepEqual(seeds.map(createSeam), packets);
});

for (const seed of seeds) test(`the ${seed.id} poem returns every authored reading`, () => {
  const packet = packets.find(item => item.id === seed.id);
  const recovered = decodeSeam(JSON.parse(JSON.stringify(packet)));
  for (const name of ['ghost', 'hex', 'a', 'b']) assert.equal(recovered[name], seed[name] || '');
  assert.equal(recovered.selected.toLowerCase(), (seed.selected || '').replace(/\s/g, '').toLowerCase());
  if (seed.selected) assert.equal(recovered.carrier, seed.carrier);
  for (const name of ['ghost', 'hex', 'a', 'b', 'selected', 'carrier']) assert(!Object.hasOwn(packet, name));
});

test('the trail includes the complete weave, register blooms and four font paths', () => {
  assert(seeds.some(seed => seed.selected && seed.ghost && seed.hex && seed.a && seed.b));
  assert(seeds.some(seed => !seed.selected && seed.a && seed.b));
  for (const mode of ['chaos_noodle', 'v1', 'debug_italic', 'debug_plain']) assert(seeds.some(seed => seed.mode === mode));
  assert(seeds.some(seed => /[^\x00-\x7F]/.test((seed.a || '') + (seed.b || ''))));
});
