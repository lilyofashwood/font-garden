import { createSeam, decodeSeam, listRegisters, listModes } from './codec.mjs';

const $ = id => document.getElementById(id);
let current = null;
const status = (message, kind = 'ok') => {
  $('status').textContent = message;
  $('status').dataset.kind = kind;
};
function fillMenu(id, choices, preferred) {
  const select = $(id);
  for (const item of choices) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.append(option);
  }
  select.value = preferred;
}
fillMenu('register', listRegisters(), 'chaos-noodle-ii');
fillMenu('mode', listModes(), 'v1');

function updateRouting() {
  const selected = Boolean($('selected').value);
  $('register').disabled = selected;
  $('mode').disabled = !selected;
}
$('selected').addEventListener('input', updateRouting);
updateRouting();

function displayPacket(packet, caption) {
  // Validation happens before the specimen or exportable state is replaced.
  decodeSeam(packet);
  current = packet;
  $('verse').textContent = packet.verse;
  $('jewel').textContent = packet.jewel;
  $('packet').value = JSON.stringify(packet, null, 2);
  $('specimen-caption').textContent = caption;
  $('recovered').hidden = true;
  for (const id of ['copy-verse', 'copy-packet', 'download']) $(id).disabled = false;
}

function weave(event) {
  event?.preventDefault();
  try {
    const packet = createSeam({
      id: $('seam-id').value,
      carrier: $('carrier').value,
      selected: $('selected').value,
      mode: $('mode').value,
      register: $('register').value,
      ghost: $('ghost').value,
      hex: $('hex').value,
      a: $('lane-a').value,
      b: $('lane-b').value,
    });
    displayPacket(packet, 'Freshly woven · your source is still beside the loom.');
    status('The seam is woven. Copy its verse, keep the packet, or open its rooms.');
  } catch (error) {
    status(error.message, 'error');
  }
}
$('weave-form').addEventListener('submit', weave);

$('unfold').addEventListener('click', () => {
  $('recovered').hidden = true;
  try {
    const raw = $('packet').value;
    if (!raw.trim()) throw new Error('Paste a complete seam packet, or weave one first.');
    if (raw.length > 300000) throw new Error('This packet is too large for the loom.');
    let packet;
    try { packet = JSON.parse(raw); } catch { throw new Error('The packet needs complete, valid JSON.'); }
    const decoded = decodeSeam(packet);
    displayPacket(packet, 'Opened from an intact packet · every layer has its place.');
    for (const field of ['carrier', 'selected', 'ghost', 'hex', 'a', 'b']) {
      const target = $('out-' + field);
      target.textContent = decoded[field] || '∅';
      target.dataset.empty = String(decoded[field] === '');
    }
    $('recovery-status').textContent = decoded.carrierStatus === 'styled-exact'
      ? 'All threads recovered. The carrier keeps its exact letter costume.'
      : 'All threads recovered. The selected-letter carrier is plain again.';
    $('recovered').hidden = false;
    status('The rooms are open. A second reading, held beside the first.');
  } catch (error) {
    status(error.message, 'error');
  }
});

function selectFallback(element) {
  element.focus();
  if ('select' in element) element.select();
  else {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
async function copy(which) {
  if (!current) return;
  const packetCopy = which === 'packet';
  const exact = packetCopy ? JSON.stringify(current, null, 2) : current.verse;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable.');
    await navigator.clipboard.writeText(exact);
    status(packetCopy ? 'The whole packet is on your clipboard.' : 'The exact verse is on your clipboard, including its invisible threads.');
  } catch {
    if (packetCopy) {
      $('packet-details').open = true;
      $('packet').value = exact;
    }
    selectFallback($(packetCopy ? 'packet' : 'verse'));
    status('The exact text is selected. Use your usual copy command to carry it away.');
  }
}
$('copy-verse').addEventListener('click', () => copy('verse'));
$('copy-packet').addEventListener('click', () => copy('packet'));
$('download').addEventListener('click', () => {
  if (!current) return;
  const blob = new Blob([JSON.stringify(current, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = current.id + '.garden-seam.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status('A little packet of rooms, saved to your downloads.');
});

let trailRequest = 0;
async function openTrail() {
  const request = ++trailRequest;
  const hash = location.hash.slice(1);
  if (!hash) return;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(hash)) {
    status('Garden links name one seam using lowercase letters, digits and hyphens.', 'error');
    return;
  }
  try {
    // Only an authored, same-directory artifact can supply a trail packet.
    const response = await fetch(new URL('trail.json', import.meta.url));
    if (!response.ok) throw new Error('The garden trail is not available in this local copy yet.');
    const manifest = await response.json();
    const packets = Array.isArray(manifest) ? manifest : manifest.packets;
    if (!Array.isArray(packets)) throw new Error('The garden trail needs its packet collection.');
    const packet = packets.find(item => item && item.id === hash);
    if (!packet) throw new Error('This seam name is not in the garden trail.');
    if (request !== trailRequest) return;
    displayPacket(packet, 'A seam from elsewhere in the garden · unfold it when you wish.');
    status('A garden seam is on the loom. Its rooms are still closed.');
  } catch (error) {
    if (request === trailRequest) status(error.message, 'error');
  }
}
window.addEventListener('hashchange', openTrail);
weave();
await openTrail();
document.body.dataset.seamReady = 'true';
