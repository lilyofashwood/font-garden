#!/usr/bin/env node
/* Read-only publication planner: prints apply_patch input, never writes repos. */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeSeam } from './codec.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPOS = resolve(HERE, '../..');
export const TARGETS = Object.freeze({
  'font-garden': { repo: 'font-garden', pages: ['index.html'], css: 'presentation.css' },
  'steg-web': { repo: 'workspace-context', pages: ['index.html'], inline: true },
  'chatlog-printer': { repo: 'chatlog-printer', pages: ['index.html'], css: 'presentation.css' },
  'diacritic-bloom': { repo: 'diacritic-bloom', pages: ['index.html'], css: 'presentation.css', extraReadmes: ['.github/README.md'] },
  'ghost-hex': { repo: 'ghost-hex-main', pages: ['index.html'], css: 'style.css' },
  hexmoji: { repo: 'hexmoji', pages: ['index.html'], css: 'presentation.css' },
  'kagami-no-migaka': { repo: 'kasane-uta', pages: ['index.html'], css: 'style.css' },
  'melody-cipher': { repo: 'melody-cipher', pages: ['gallery.html'], css: 'presentation.css' },
  messageloggerfix: { repo: 'messageloggerfix-main', pages: ['index.html'], inline: true },
  'moon-tears': { repo: 'moon-tears', pages: ['index.html'], css: 'presentation.css' },
  'ouroboros-cipher': { repo: 'ouroboros-cipher', pages: ['index.html'], css: 'style.css' },
  uniception: { repo: 'steg-web', pages: ['index.html'], css: 'style.css' },
  twitterpainted: { repo: 'twitterpainted', pages: ['docs/index.html'], css: 'docs/twitterpainted.css' },
  'zalgo-cipher': { repo: 'zalgo-cipher-main', pages: ['index.html', 'zalgo-cipher-v3.html'], css: 'v3.css', inlinePages: ['index.html'] },
});
export const CSS = `/* garden-seam:start */
.garden-seam{display:block;position:relative;box-sizing:border-box;min-width:0;max-width:62rem;margin:2rem auto;padding:1.4rem 1.5rem;border:1px solid #8b779666;border-radius:18px;background:linear-gradient(120deg,#39214622,#264b4422);color:inherit;text-align:left}
.garden-seam h2{font:inherit;font-size:1rem;letter-spacing:.04em;margin:0 0 .75rem;color:inherit}
.garden-seam .garden-seam-wire,.garden-seam .garden-seam-jewel{display:block;box-sizing:border-box;width:auto;min-width:0;max-width:100%;max-height:none;margin:0;padding:.65rem .2rem;border:0;background:none;box-shadow:none;color:inherit;font:500 clamp(.9rem,2.2vw,1.12rem)/2 STIXGeneral,"STIX Two Math","Cambria Math","Apple Symbols",serif;letter-spacing:normal;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;overflow:visible}
.garden-seam .garden-seam-jewel{font-size:1.2rem;line-height:1.7}
.garden-seam .garden-seam-hint{margin:.75rem 0 0;font-size:.84rem;line-height:1.7;color:inherit}
.garden-seam .garden-seam-hint a{display:inline;padding:0;border:0;background:none;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:.25em}
@media(max-width:480px){.garden-seam{padding:1.1rem .8rem;margin:1.4rem auto}}
@media print{.garden-seam{display:none!important}}
/* garden-seam:end */`;
const escapeHTML = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const house = text => Array.from(text, ch => /[a-z]/.test(ch) ? String.fromCodePoint((/[aeiou]/.test(ch) ? 0x1D41A : 0x1D5BA) + ch.charCodeAt(0) - 97) : ch).join('');
export function renderRegion(packet) {
  decodeSeam(packet);
  return `<!-- garden-seam:${packet.id}:start -->
<section class="garden-seam" data-garden-seam="${packet.id}" aria-label="A seam in the garden">
<h2>⟡ ${house('a seam in the garden')} ⟡</h2>
<pre class="garden-seam-wire literal" data-garden-raw data-literal>${escapeHTML(packet.verse)}</pre>
${packet.jewel ? `<pre class="garden-seam-jewel literal" data-garden-raw data-literal>${escapeHTML(packet.jewel)}</pre>\n` : ''}<p class="garden-seam-hint"><a href="https://lilyofashwood.github.io/font-garden/seams/#${packet.id}" aria-label="Unfold this garden seam">${house('unfold the seam')} ↗</a></p>
</section>
<!-- garden-seam:${packet.id}:end -->`;
}
function swapRegion(source, packet, isPage) {
  const start = `<!-- garden-seam:${packet.id}:start -->`, end = `<!-- garden-seam:${packet.id}:end -->`;
  const region = renderRegion(packet), begin = source.indexOf(start), finish = source.indexOf(end);
  if (begin >= 0 || finish >= 0) {
    if (begin < 0 || finish < begin || source.indexOf(start, begin + start.length) >= 0) throw new Error('Malformed existing seam region: ' + packet.id);
    return source.slice(0, begin) + region + source.slice(finish + end.length);
  }
  if (!isPage) return source + '\n' + region + '\n';
  let at = source.lastIndexOf('</main>');
  if (at < 0) at = source.lastIndexOf('</body>');
  if (at < 0) throw new Error('Page needs an explicit main or body end: ' + packet.id);
  const lineStart = source.lastIndexOf('\n', at - 1) + 1;
  if (/^[ \t]*$/.test(source.slice(lineStart, at))) at = lineStart;
  return source.slice(0, at) + '\n' + region + '\n' + source.slice(at);
}
function withCSS(source, inline) {
  const start = source.indexOf('/* garden-seam:start */'), end = source.indexOf('/* garden-seam:end */');
  if (start >= 0 || end >= 0) {
    if (start < 0 || end < start) throw new Error('Malformed existing seam CSS region.');
    return source.slice(0, start) + CSS + source.slice(end + '/* garden-seam:end */'.length);
  }
  if (!inline) return source + '\n' + CSS + '\n';
  let at = source.indexOf('</style>');
  if (at < 0) throw new Error('Inline destination has no existing style element.');
  const lineStart = source.lastIndexOf('\n', at - 1) + 1;
  if (/^[ \t]*$/.test(source.slice(lineStart, at))) at = lineStart;
  return source.slice(0, at) + '\n' + CSS + '\n' + source.slice(at);
}
export function planTrailInstallation(ids = Object.keys(TARGETS), reposRoot = REPOS) {
  const packets = JSON.parse(readFileSync(resolve(HERE, 'trail.json'), 'utf8'));
  const plans = [];
  for (const id of ids) {
    const target = TARGETS[id], packet = packets.find(item => item.id === id);
    if (!target || !packet) throw new Error('Unknown trail target: ' + id);
    decodeSeam(packet);
    const repo = resolve(reposRoot, target.repo);
    for (const file of ['README.md', ...(target.extraReadmes || []), ...target.pages]) {
      const path = resolve(repo, file), before = readFileSync(path, 'utf8'), isPage = target.pages.includes(file);
      let after = swapRegion(before, packet, isPage);
      if (isPage && (target.inline || target.inlinePages?.includes(file))) after = withCSS(after, true);
      plans.push({ id, path, before, after });
    }
    if (target.css) {
      const path = resolve(repo, target.css), before = readFileSync(path, 'utf8');
      plans.push({ id, path, before, after: withCSS(before, false) });
    }
  }
  return plans;
}
export function renderPatch(plans) {
  const out = ['*** Begin Patch'];
  for (const { path, before, after } of plans) {
    if (before === after) continue;
    const a = before.split('\n'), b = after.split('\n');
    if (a.at(-1) === '') a.pop();
    if (b.at(-1) === '') b.pop();
    let prefix = 0, suffix = 0;
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
    while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
    const start = Math.max(0, prefix - 3), oldEnd = Math.min(a.length, a.length - suffix + 3), newEnd = Math.min(b.length, b.length - suffix + 3);
    out.push('*** Update File: ' + path, '@@', ...a.slice(start, prefix).map(line => ' ' + line), ...a.slice(prefix, a.length - suffix).map(line => '-' + line), ...b.slice(prefix, b.length - suffix).map(line => '+' + line), ...a.slice(a.length - suffix, oldEnd).map(line => ' ' + line));
    if (oldEnd - (a.length - suffix) !== newEnd - (b.length - suffix)) throw new Error('Patch context mismatch.');
  }
  out.push('*** End Patch');
  return out.join('\n') + '\n';
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), idArg = args.find(arg => arg.startsWith('--ids='));
  if (args.some(arg => arg !== '--patch' && arg !== '--check' && !arg.startsWith('--ids='))) throw new Error('Use --patch or --check and optional --ids=id,id.');
  const plans = planTrailInstallation(idArg ? idArg.slice(6).split(',') : undefined);
  if (args.includes('--check')) {
    const changed = plans.filter(plan => plan.before !== plan.after);
    if (changed.length) throw new Error('Trail installation differs in: ' + changed.map(plan => plan.path).join(', '));
    console.log('Exact trail regions and CSS verified in ' + plans.length + ' files.');
  } else process.stdout.write(renderPatch(plans));
}
