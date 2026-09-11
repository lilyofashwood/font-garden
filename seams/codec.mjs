/* Garden Seams 1 — a composition of Lily of Ashwood's existing garden codecs. */
import '../font-garden.js';
import '../register-recipes.js';
import { MODES as UNICEPTION_MODES, legacyEncode, legacyDecode, normalizeLegacy } from './vendor/uniception-core.mjs';
import './vendor/hexmoji-core.mjs';
import './vendor/zalgo-mux3.mjs';

const Garden = globalThis.FontGarden;
const Hexmoji = globalThis.Hexmoji;
const Zalgo = globalThis.ZalgoMux;
const utf8 = new TextEncoder();
const OWN = Object.prototype.hasOwnProperty;
const INPUT_KEYS = ['id', 'carrier', 'selected', 'mode', 'register', 'ghost', 'hex', 'a', 'b'];
const PACKET_KEYS = ['format', 'version', 'id', 'mode', 'register', 'marked', 'verse', 'jewel', 'integrity'];
const ghostScalar = cp => cp >= 0xE0100 && cp <= 0xE017F;
const selectorScalar = cp => cp >= 0xE0100 && cp <= 0xE01EF;

export const LIMITS = Object.freeze({ carrier: 4000, payload: 2048, payloadBytes: 2048, baseVerse: 20000, verse: 80000, jewel: 4096 });
export const MODES = Object.freeze(Object.keys(UNICEPTION_MODES));
const modeNames = Object.freeze({ v1: 'Uniception I', chaos_noodle: 'Chaos Noodle', two_plains: 'Two Plains', debug_italic: 'Italic Lanes', debug_plain: 'Sans Lanes', aesthetic: 'Aesthetic' });
export const listModes = () => MODES.map(id => ({ id, name: modeNames[id] }));
export const listRegisters = () => Garden.list().map(({ id, name }) => ({ id, name }));

function record(value, allowed, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    throw new TypeError(label + ' must be a plain record.');
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !allowed.includes(key)) throw new TypeError(label + ' has an unknown field.');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !OWN.call(descriptor, 'value')) throw new TypeError(label + ' must contain ordinary data fields.');
  }
  return value;
}
function text(value, max, label) {
  if (typeof value !== 'string') throw new TypeError(label + ' must be a string.');
  if (value.length > max) throw new RangeError(label + ' exceeds ' + max + ' UTF-16 code units.');
  for (const ch of value) {
    const cp = ch.codePointAt(0);
    if (cp >= 0xD800 && cp <= 0xDFFF) throw new TypeError(label + ' contains an unpaired surrogate.');
  }
  return value;
}
function idCheck(id) {
  text(id, 64, 'Seam id');
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(id)) throw new TypeError('Seam id uses lowercase letters, digits and interior hyphens.');
}
function modeCheck(mode) {
  if (typeof mode !== 'string' || !MODES.includes(mode)) throw new TypeError('Unknown Uniception mode.');
}
function registerCheck(register) {
  if (typeof register !== 'string' || !listRegisters().some(item => item.id === register)) throw new TypeError('Unknown font register.');
}
function collisionCheck(carrier) {
  if (Array.from(carrier).some(ch => selectorScalar(ch.codePointAt(0))))
    throw new TypeError('Carrier already contains supplementary variation selectors; choose a separate verse for the Ghost Hex channel.');
}
function payloadText(value, label) {
  text(value, LIMITS.payload, label);
  if (utf8.encode(value).length > LIMITS.payloadBytes) throw new RangeError(label + ' exceeds ' + LIMITS.payloadBytes + ' UTF-8 bytes.');
}
function ghostEncode(value) {
  return Array.from(value, ch => {
    const cp = ch.codePointAt(0);
    if (cp > 0x7F) throw new TypeError('Ghost Hex accepts ASCII 0x00–0x7F.');
    return String.fromCodePoint(0xE0100 + cp);
  }).join('');
}
function ghostDecode(verse) {
  let carrier = '', ghost = '';
  for (const ch of verse) {
    const cp = ch.codePointAt(0);
    if (ghostScalar(cp)) ghost += String.fromCharCode(cp - 0xE0100);
    else {
      if (selectorScalar(cp)) throw new TypeError('Verse contains a supplementary selector outside the Ghost Hex ASCII channel.');
      carrier += ch;
    }
  }
  text(ghost, LIMITS.payload, 'Recovered Ghost Hex');
  return { carrier, ghost };
}
function packetBody(packet) {
  return JSON.stringify([packet.format, packet.version, packet.id, packet.mode, packet.register, packet.marked, packet.verse, packet.jewel]);
}
function checksum(packet) {
  return Zalgo.crc32(utf8.encode(packetBody(packet))).toString(16).padStart(8, '0');
}
function checkPacket(packet) {
  record(packet, PACKET_KEYS, 'Seam packet');
  if (PACKET_KEYS.some(key => !OWN.call(packet, key))) throw new TypeError('Seam packet is missing a required field.');
  if (packet.format !== 'garden-seam' || packet.version !== 1) throw new TypeError('Expected garden-seam version 1.');
  idCheck(packet.id);
  if (packet.mode !== null) modeCheck(packet.mode);
  registerCheck(packet.register);
  if (typeof packet.marked !== 'boolean') throw new TypeError('Marked must be a boolean.');
  text(packet.verse, LIMITS.verse, 'Verse');
  text(packet.jewel, LIMITS.jewel, 'Hexmoji jewel');
  if (!packet.verse) throw new TypeError('Give the seam a carrier.');
  record(packet.integrity, ['algorithm', 'value'], 'Integrity');
  if (packet.integrity.algorithm !== 'crc32' || typeof packet.integrity.value !== 'string' || !/^[0-9a-f]{8}$/.test(packet.integrity.value))
    throw new TypeError('Expected a lowercase CRC32 integrity value.');
  if (checksum(packet) !== packet.integrity.value) throw new Error('Seam checksum differs: copy the complete original packet.');
}

/** Compose a verse, invisible ASCII whisper, visible jewel and independent mark lanes. */
export function createSeam(options) {
  record(options, INPUT_KEYS, 'Seam options');
  const { id, carrier, selected = '', mode = 'v1', register = 'chaos-noodle-ii', ghost = '', hex = '', a = '', b = '' } = options;
  idCheck(id);
  text(carrier, LIMITS.carrier, 'Carrier');
  if (!carrier || !/[^\s\p{M}\p{Cf}]/u.test(carrier)) throw new TypeError('Give the seam a visible carrier.');
  modeCheck(mode);
  registerCheck(register);
  for (const [label, value] of [['Selected letters', selected], ['Ghost Hex', ghost], ['Hexmoji', hex], ['Mark lane A', a], ['Overlay lane B', b]]) payloadText(value, label);
  const wanted = normalizeLegacy(selected);
  if (selected && !wanted) throw new TypeError('Selected letters must contain at least one ASCII letter, or be empty.');
  collisionCheck(carrier);
  let verse = selected ? legacyEncode(carrier, selected, mode).encoded : Garden.apply(register, carrier);
  text(verse, LIMITS.baseVerse, 'Styled carrier');
  collisionCheck(verse);
  verse += ghostEncode(ghost);
  text(verse, LIMITS.baseVerse, 'Carrier with Ghost Hex');
  const marked = Boolean(a || b);
  if (marked) verse = Zalgo.encode(verse, a, b).encoded;
  const jewel = Hexmoji.encodeDirect(hex);
  const packet = { format: 'garden-seam', version: 1, id, mode: selected ? mode : null, register, marked, verse, jewel };
  packet.integrity = { algorithm: 'crc32', value: checksum(packet) };
  const recovered = decodeSeam(packet);
  if (recovered.ghost !== ghost || recovered.hex !== hex || recovered.a !== a || recovered.b !== b || (selected && (recovered.carrier !== carrier || recovered.selected.toLowerCase() !== wanted.toLowerCase())))
    throw new Error('Seam round-trip failed.');
  return packet;
}

/** Peel marks → Ghost Hex → selected-letter fonts; decode the jewel separately. */
export function decodeSeam(packet) {
  checkPacket(packet);
  let verse = packet.verse, a = '', b = '', markStatus = 'absent';
  if (packet.marked) {
    const marks = Zalgo.decode(verse);
    if (marks.a.status !== 'exact' || marks.b.status !== 'exact' || marks.carrier.status !== 'exact')
      throw new Error('Zalgo MUX 3 lanes and carrier must recover exactly.');
    verse = marks.carrier.value;
    a = marks.a.payload;
    b = marks.b.payload;
    if (!a && !b) throw new Error('A marked seam must carry at least one nonempty mark lane.');
    payloadText(a, 'Recovered lane A');
    payloadText(b, 'Recovered lane B');
    markStatus = 'exact';
  }
  text(verse, LIMITS.baseVerse, 'Recovered base verse');
  const ghost = ghostDecode(verse);
  const letters = packet.mode === null ? { carrier: ghost.carrier, secret: '' } : legacyDecode(ghost.carrier, packet.mode);
  if (packet.mode !== null && !letters.secret) throw new Error('A selected-letter seam must carry at least one selected letter.');
  text(letters.secret, LIMITS.payload, 'Recovered selected letters');
  const hex = Hexmoji.decodeDirect(packet.jewel);
  payloadText(hex, 'Recovered Hexmoji');
  return {
    id: packet.id, carrier: letters.carrier, selected: letters.secret, ghost: ghost.ghost, hex, a, b,
    mode: packet.mode, register: packet.register,
    carrierStatus: packet.mode === null ? 'styled-exact' : 'plain-exact',
    selectedStatus: packet.mode === null ? 'absent' : 'carrier-case',
    ghostStatus: ghost.ghost ? 'exact' : 'empty', hexStatus: hex ? 'exact' : 'empty', markStatus,
    integrityStatus: 'matched',
  };
}
