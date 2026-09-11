import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createSeam, decodeSeam, listRegisters, listModes, MODES, LIMITS } from './codec.mjs';
import { legacyEncode } from './vendor/uniception-core.mjs';

const Garden = globalThis.FontGarden, Zalgo = globalThis.ZalgoMux, Hexmoji = globalThis.Hexmoji;
const base = { id: 'kettle-garden', carrier: 'the kettle is still on; bring a small moon' };
const clone = value => JSON.parse(JSON.stringify(value));
function reseal(packet) {
  const body = JSON.stringify([packet.format, packet.version, packet.id, packet.mode, packet.register, packet.marked, packet.verse, packet.jewel]);
  packet.integrity = { algorithm: 'crc32', value: Zalgo.crc32(new TextEncoder().encode(body)).toString(16).padStart(8, '0') };
  return packet;
}

test('five channels recover exactly after JSON transport', () => {
  const options = { ...base, selected: 'kettle', mode: 'chaos_noodle', ghost: 'a small door', hex: 'moon!', a: 'rain 谷', b: 'valley 雨' };
  const packet = createSeam(options), decoded = decodeSeam(clone(packet));
  for (const key of ['carrier', 'selected', 'ghost', 'hex', 'a', 'b']) assert.equal(decoded[key], options[key]);
  assert.equal(decoded.integrityStatus, 'matched');
  assert.equal(packet.mode, 'chaos_noodle');
  assert.equal(packet.marked, true);
  for (const field of ['carrier', 'selected', 'ghost', 'hex', 'a', 'b']) assert.equal(Object.hasOwn(packet, field), false);
  assert.equal(JSON.stringify(packet).includes('a small door'), false);
});

for (const register of listRegisters()) test(`marks bloom over register ${register.id}`, () => {
  const options = { ...base, register: register.id, ghost: 'hello', hex: 'garden', a: 'petal A', b: 'petal B' };
  const packet = createSeam(options), decoded = decodeSeam(packet);
  assert.equal(decoded.carrier, Garden.apply(register.id, base.carrier));
  assert.equal(decoded.carrierStatus, 'styled-exact');
  assert.equal(decoded.selected, '');
  for (const key of ['ghost', 'hex', 'a', 'b']) assert.equal(decoded[key], options[key]);
});

test('the full catalog and six canonical legacy modes are selectable', () => {
  assert.equal(listRegisters().length, 78);
  assert.equal(new Set(listRegisters().map(r => r.id)).size, 78);
  assert.deepEqual(listModes().map(m => m.id), MODES);
  for (const mode of MODES) {
    const packet = createSeam({ ...base, selected: 'kettle', mode, register: 'ribbon' });
    assert.equal(packet.verse, legacyEncode(base.carrier, 'kettle', mode).encoded);
    assert.equal(decodeSeam(packet).selected, 'kettle');
  }
});

test('all ASCII Ghost Hex bytes match independently generated canonical Python vectors', () => {
  const reference = JSON.parse(readFileSync(new URL('./vendor/ghost-hex-ascii-reference.json', import.meta.url), 'utf8'));
  assert.equal(reference.vectors.length, 128);
  const ghost = reference.vectors.map(([byte]) => String.fromCharCode(byte)).join('');
  const packet = createSeam({ ...base, register: 'plain', ghost });
  assert.deepEqual(Array.from(packet.verse.slice(base.carrier.length), c => c.codePointAt(0)), reference.vectors.map(([, cp]) => cp));
  assert.equal(decodeSeam(packet).ghost, ghost);
  assert.equal(reference.vectors[0x74][1], 0xE0174);
});

test('the Hexmoji jewel retains its direct printable-ASCII identity', () => {
  const hex = Array.from({ length: 95 }, (_, n) => String.fromCharCode(0x20 + n)).join('');
  const packet = createSeam({ ...base, hex });
  assert.equal(packet.jewel, Hexmoji.encodeDirect(hex));
  assert.equal(decodeSeam(packet).hex, hex);
  assert.equal(createSeam({ ...base, hex: 'L' }).jewel, '🍌');
  for (const invalid of ['\n', '\x00', '\x7F', 'é', '🐈']) assert.throws(() => createSeam({ ...base, hex: invalid }), /printable ASCII/);
  for (const invalid of ['é', '🐈', '\u0080']) assert.throws(() => createSeam({ ...base, ghost: invalid }), /ASCII/);
});

test('each mark lane is independently decodable even if its neighbor is damaged', () => {
  const packet = createSeam({ ...base, a: 'petal A', b: 'petal B', ghost: 'hello' });
  for (const [lane, neighbor] of [['a', 'b'], ['b', 'a']]) {
    assert.equal(Zalgo.decodeLane(packet.verse, lane).payload, lane === 'a' ? 'petal A' : 'petal B');
    const chars = Array.from(packet.verse), guard = Zalgo.GUARDS[neighbor];
    const at = chars.indexOf(guard);
    chars[at + 1] = '!';
    const damaged = chars.join('');
    assert.equal(Zalgo.decodeLane(damaged, lane).status, 'exact');
    assert.throws(() => Zalgo.decodeLane(damaged, neighbor), /Malformed/);
    assert.throws(() => decodeSeam(reseal({ ...packet, verse: damaged })), /Zalgo MUX/);
  }
});

test('the packet detects edits to every wire and routing field', () => {
  for (const marked of [false, true]) {
    const packet = createSeam({ ...base, ghost: 'hello', hex: 'moon', ...(marked ? { a: 'rain' } : {}) });
    for (const [key, value] of [['id', 'different'], ['mode', 'v1'], ['register', 'plain'], ['marked', !marked], ['verse', packet.verse + '!'], ['jewel', packet.jewel + '🍌']])
      assert.throws(() => decodeSeam({ ...packet, [key]: value }), /checksum/);
  }
});

test('styled prose and existing decorative marks stay outside the selected-letter channel', () => {
  const carrier = Garden.apply('chaos-noodle-ii', 'the kettle is still on') + ' ◌̍︎\u034F\u2063';
  const packet = createSeam({ ...base, carrier, register: 'plain', a: 'rain', b: 'moon' });
  assert.equal(decodeSeam(packet).carrier, carrier);
  assert.equal(decodeSeam(packet).selected, '');
  assert.throws(() => createSeam({ ...base, carrier, selected: 'kettle' }), /already contains/);
  assert.equal(decodeSeam(createSeam({ ...base, carrier, register: 'plain' })).carrier, carrier);
  for (const cp of [0xE0100, 0xE0174, 0xE0180, 0xE01EF])
    assert.throws(() => createSeam({ ...base, carrier: 'petal' + String.fromCodePoint(cp) }), /already contains supplementary/);
});

test('empty lanes stay empty, and marked packets frame the empty sibling exactly', () => {
  const empty = createSeam(base), decoded = decodeSeam(empty);
  assert.equal(empty.marked, false);
  assert.equal(empty.mode, null);
  assert.equal(empty.jewel, '');
  for (const field of ['selected', 'ghost', 'hex', 'a', 'b']) assert.equal(decoded[field], '');
  for (const lane of ['a', 'b']) {
    const packet = createSeam({ ...base, [lane]: 'hello' });
    assert.equal(Zalgo.decodeLane(packet.verse, lane === 'a' ? 'b' : 'a').payload, '');
    assert.equal(decodeSeam(packet)[lane], 'hello');
  }
});

test('custom Unicode graphemes, joined emoji and escaped guards retain exact source order', () => {
  const carrier = '👩🏽‍💻 · 🏳️‍🌈 · e\u0301 · क्‍ष · 雨 · ♌︎ · \u034F\u2063';
  const packet = createSeam({ ...base, carrier, register: 'plain', ghost: 'between the petals', a: 'valley 谷', b: 'rain 雨' });
  assert.equal(decodeSeam(packet).carrier, carrier);
  assert.equal(decodeSeam(packet).ghost, 'between the petals');
  assert.throws(() => decodeSeam({ ...packet, verse: packet.verse.normalize('NFC') }), /checksum/);
});

test('selected letters use exact canonical whitespace and carrier-case rules', () => {
  const packet = createSeam({ ...base, carrier: 'The Kettle Is Still On', selected: 'k e t t l e' });
  assert.equal(decodeSeam(packet).selected, 'Kettle');
  assert.equal(decodeSeam(packet).carrier, 'The Kettle Is Still On');
  for (const selected of ['!','é','🐈','123','   ']) assert.throws(() => createSeam({ ...base, selected }));
  assert.throws(() => createSeam({ ...base, selected: 'xyz' }), /cannot host/);
});

test('HTML-like source and hidden messages are returned only as inert strings', () => {
  const carrier = '<img src=x onerror="alert(1)"> a poem </textarea><script>hello</script>';
  const packet = createSeam({ ...base, carrier, register: 'plain', a: '<script>window.leak=1</script>', ghost: '<b>petal</b>' });
  const decoded = decodeSeam(packet);
  assert.equal(decoded.carrier, carrier);
  assert.equal(decoded.a, '<script>window.leak=1</script>');
  assert.equal(globalThis.leak, undefined);
  const source = readFileSync(new URL('./codec.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\beval\s*\(|\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b|\bsessionStorage\b|\binnerHTML\b|\bdocument\b/);
});

test('malformed Unicode, metadata, fields and resource overflows reject', () => {
  for (const key of ['carrier', 'selected', 'ghost', 'hex', 'a', 'b']) {
    for (const value of ['\uD800', '\uDC00', 1, null, {}, []]) assert.throws(() => createSeam({ ...base, [key]: value }));
  }
  for (const id of ['', 'UPPER', '-start', 'end-', 'with space', 'x'.repeat(65), null, NaN]) assert.throws(() => createSeam({ ...base, id }));
  for (const mode of ['__proto__', 'unknown', null, 1]) assert.throws(() => createSeam({ ...base, mode }));
  for (const register of ['__proto__', 'unknown', null, 1]) assert.throws(() => createSeam({ ...base, register }));
  for (const carrier of ['', ' ', '\u034F', 'x'.repeat(LIMITS.carrier + 1)]) assert.throws(() => createSeam({ ...base, carrier }));
  for (const key of ['selected', 'ghost', 'hex', 'a', 'b']) assert.throws(() => createSeam({ ...base, [key]: 'a'.repeat(LIMITS.payload + 1) }));
  assert.throws(() => createSeam({ ...base, a: '雨'.repeat(683) }), /UTF-8 bytes/);
  assert.throws(() => createSeam({ ...base, surprise: 'no' }), /unknown field/);
  let read = false;
  assert.throws(() => createSeam({ ...base, get ghost() { read = true; return 'hello'; } }), /ordinary data fields/);
  assert.equal(read, false);
  const packet = createSeam(base);
  for (const input of [null, [], '', { ...packet, version: NaN }, { ...packet, format: 'other' }, { ...packet, extra: '' }, { ...packet, marked: 1 }, { ...packet, verse: '\uD800' }, { ...packet, verse: 'x'.repeat(LIMITS.verse + 1) }]) assert.throws(() => decodeSeam(input));
  const missing = clone(packet); delete missing.mode;
  assert.throws(() => decodeSeam(missing), /required field/);
  assert.throws(() => decodeSeam(reseal({ ...packet, jewel: 'A' })), /outside the direct/);
  assert.throws(() => decodeSeam(reseal({ ...packet, verse: packet.verse + String.fromCodePoint(0xE0180) })), /outside the Ghost Hex/);
});

test('maximum configured channel sizes recover inside finite wire limits', () => {
  const packet = createSeam({ ...base, carrier: 'x'.repeat(LIMITS.carrier), register: 'plain', ghost: 'g'.repeat(LIMITS.payload), hex: 'h'.repeat(LIMITS.payload), a: 'a'.repeat(LIMITS.payload), b: 'b'.repeat(LIMITS.payload) });
  assert.ok(packet.verse.length <= LIMITS.verse);
  assert.equal(decodeSeam(packet).b.length, LIMITS.payload);
});

test('vendored canonical sources retain their exact upstream bytes', () => {
  const expected = {
    'uniception-core.mjs': 'bd2bb6bbbd162bdd45425c48d341a7faa747998d89ce7c264847844c655d7dbd',
    'hexmoji-core.mjs': '298c67d9197f0fb2731bde5549aedc062e35e8f3c2e6233a63ad3da1903771a4',
    'zalgo-mux3.mjs': '37c7b9cba4cc9f86c4fbe1938659592f11df64177e43dad77faf1c920f9c33bc',
  };
  for (const [file, hash] of Object.entries(expected)) {
    const bytes = readFileSync(new URL('./vendor/' + file, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash);
    assert.match(readFileSync(new URL('./vendor/' + file + '.LICENSE', import.meta.url), 'utf8'), /Copyright \(c\) 2026 lilyofashwood/);
  }
});
