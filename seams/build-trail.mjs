/** Reproducible garden artwork. Emit an apply_patch patch, or verify checked-in packets. */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createSeam, decodeSeam } from './codec.mjs';

const here = new URL('./', import.meta.url);
const seeds = JSON.parse(readFileSync(new URL('seeds.json', here), 'utf8'));
assert.equal(seeds.length, 14);
assert.equal(new Set(seeds.map(seed => seed.id)).size, seeds.length);
const packets = seeds.map(seed => {
  const packet = createSeam(seed);
  const recovered = decodeSeam(packet);
  for (const key of ['ghost', 'hex', 'a', 'b']) assert.equal(recovered[key], seed[key] || '', `${seed.id}: ${key}`);
  assert.equal(recovered.selected.toLowerCase(), (seed.selected || '').replace(/\s/g, '').toLowerCase(), seed.id);
  if (seed.selected) assert.equal(recovered.carrier, seed.carrier, seed.id);
  return packet;
});
const output = JSON.stringify(packets, null, 2) + '\n';
const target = fileURLToPath(new URL('trail.json', here));
const original = existsSync(target) ? readFileSync(target, 'utf8') : null;
if (process.argv.includes('--patch')) {
  if (original === output) process.exit(0);
  const lines = text => text.replace(/\n$/, '').split('\n');
  console.log('*** Begin Patch');
  if (original === null) console.log('*** Add File: ' + target);
  else {
    console.log('*** Update File: ' + target + '\n@@');
    for (const line of lines(original)) console.log('-' + line);
  }
  for (const line of lines(output)) console.log('+' + line);
  console.log('*** End Patch');
} else {
  assert.equal(original, output, 'Regenerate trail.json with --patch and apply the emitted patch.');
  console.log('14 distinct seams reproduce exactly; every composed channel returns its authored message.');
}
