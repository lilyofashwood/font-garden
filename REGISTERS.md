# Font Garden register implementations · 1.0.0

Recovery baseline: Veil-Script 0.2.1 and synthetic-register design JSON v1.0. Executable register recipes dated 2026-09-10. The recovered examples remain unchanged alongside their runnable continuations.

The pure 50-style catalog was mechanically extracted from the original HTML's maps, transforms and style registry. Existing substitution behavior is retained, including case collapse in single-case maps and lossy best-effort inverse maps. The current catalog's one correction (2026-09-10) makes Mirror Room and Upside Down reverse grapheme clusters and substitute only each cluster's first code point, preserving accents, emoji modifiers, ZWJ sequences, flags and keycaps internally. These two styles leave input unchanged when `Intl.Segmenter` is unavailable. The original 0.2.1 HTML, registry and historical examples remain untouched, including their old code-point orientation behavior. The exact current Unicode result can be used as a Zalgo v3 carrier. Save the source separately when a style collapses case or merges symbols.

Run `node --test tests/catalog.cjs` for standalone orientation and unsupported-runtime regressions. The existing `tests/browser.cjs` checks all 78 gallery cards and browser interactions.

Two exact letter maps complete Diacritic Bloom's 14-family mathematical set: italic (including the U+210E exception for small h), and bold italic. Decimal digits are not added to either family because neither has a native mathematical digit alphabet.

All new synthetic rules operate only on ASCII A–Z/a–z, preserving other source code points. A word is a maximal `[A-Za-z]+` run. Positions are one-based across ASCII letters, excluding punctuation and whitespace; word-local indices start at zero. Case passes through chosen math maps. The historical phrases “lossless by normalization” apply only inside the transformed ASCII domain, not to arbitrary pre-existing mathematical symbols.

| ID | Executable rule |
| --- | --- |
| loomstep | script, mono alternating |
| counterloom | mono, script alternating |
| vowelflare | bold-script vowels, mono consonants |
| iron-vowels | double-struck vowels, bold-Fraktur consonants |
| chaos-noodle-ii | mathematical-bold vowels, sans-regular consonants |
| primewire | Fraktur at prime positions (2,3,5…), mono otherwise |
| fibonacci-bloom | bold-script at 1,2,3,5,8…, sans otherwise |
| triune-relay | script → mono → bold-sans cycle |
| hex-cathedral | Fraktur → double-struck → mono cycle |
| wordphase | script → mono → bold-sans by word |
| quartet-bus | mono → italic → double-struck → bold-Fraktur by word |
| alphabet-rift | A–M script, N–Z mono |
| threshold-key | first letter double-struck, rest mono |
| cathedral-core | first/last letter bold-Fraktur, interior sans |
| bioluminal-split | first ceil(length/2) script, rest mono |
| entangled-mirror | styles script/mono/bold-sans by distance from nearest word edge |
| echo-memory | first case-insensitive occurrence mono, later occurrences bold-script |
| geminate-scar | both members of an adjacent case-insensitive repetition bold-Fraktur, others sans |
| three-seal-word | first double-struck, last bold-script, interior mono; single letters use first rule |
| third-signal | every third letter bold-italic, others mono |
| root-access | vowels a/e/i/o/u become 4/3/1/0/µ; consonants mono; U+0020 becomes · |
| blacksite-packet | mono/bold-sans/bold-Fraktur/double cycle; spaces → ::; wrap in ⟦ ⟧ |
| ghost-carrier | mono/sans/bold-Fraktur cycle; even positions add U+0332, remaining multiples of three U+035F; spaces → ` ⌁ ` |

Version 1 defines u→µ, the odd-length split, single-letter precedence, repeated-letter scope and Ghost Carrier mark priority. Root Access and separator/wrapper registers transform visible text; their substitutions merge some Unicode and punctuation readings.

Three additions expose the remaining catalog ideas: Kaomoji Heart wraps source in the recovered heart/kaomoji frame; Combining Box adds U+20E3 once to each non-whitespace grapheme; Coral Asemic emits its exact recovered specimen because the token-level dictionary is missing.

Do not use the gallery's broad cleaner on a hidden-message carrier. Normalizing or stripping marks before decoding a payload can destroy the channel. In README compositions, encode only explicitly framed carrier passages; existing house-style prose and links/code remain outside that channel.

## 𝖼𝗁𝐚𝐨𝗌 𝗇𝐨𝐨𝖽𝗅𝐞 𝐚𝗍 𝗍𝗁𝐞 𝗌𝐞𝐚𝗆

𝗍𝗁𝐞 𝗁𝐨𝐮𝗌𝐞 𝗋𝐞𝗀𝐢𝗌𝗍𝐞𝗋 𝐚𝗇𝖽 𝐮𝗇𝐢𝖼𝐞𝗉𝗍𝐢𝐨𝗇 𝗌𝗁𝐚𝗋𝐞 𝐚 𝗉𝗋𝐞𝖼𝐢𝗌𝐞 𝗉𝐚𝐢𝗋 𝐨𝖿 𝗅𝐞𝗍𝗍𝐞𝗋 𝖻𝐨𝖽𝐢𝐞𝗌. 𝐢𝗇 𝗍𝗁𝐞 `chaos_noodle` 𝗆𝐨𝖽𝐞, 𝐚 𝗌𝐞𝗅𝐞𝖼𝗍𝐞𝖽 𝗏𝐨𝗐𝐞𝗅 𝐮𝗌𝐞𝗌 𝗆𝐚𝗍𝗁𝐞𝗆𝐚𝗍𝐢𝖼𝐚𝗅 𝖻𝐨𝗅𝖽 𝐚𝗇𝖽 𝐚 𝗌𝐞𝗅𝐞𝖼𝗍𝐞𝖽 𝖼𝐨𝗇𝗌𝐨𝗇𝐚𝗇𝗍 𝐮𝗌𝐞𝗌 𝗆𝐚𝗍𝗁𝐞𝗆𝐚𝗍𝐢𝖼𝐚𝗅 𝗌𝐚𝗇𝗌-𝗌𝐞𝗋𝐢𝖿 𝗋𝐞𝗀𝐮𝗅𝐚𝗋: 𝐞𝗑𝐚𝖼𝗍𝗅𝗒 𝖼𝗁𝐚𝐨𝗌 𝗇𝐨𝐨𝖽𝗅𝐞 𝐢𝐢. 𝖼𝐨𝗏𝐞𝗋 𝗏𝐨𝗐𝐞𝗅𝗌 𝐮𝗌𝐞 𝗆𝐚𝗍𝗁𝐞𝗆𝐚𝗍𝐢𝖼𝐚𝗅 𝗌𝐚𝗇𝗌-𝗌𝐞𝗋𝐢𝖿 𝖻𝐨𝗅𝖽; 𝖼𝐨𝗏𝐞𝗋 𝖼𝐨𝗇𝗌𝐨𝗇𝐚𝗇𝗍𝗌 𝐮𝗌𝐞 𝐚𝗌𝖼𝐢𝐢. 𝗍𝗁𝐞 𝖿𝐨𝐮𝗋 𝖻𝐨𝖽𝐢𝐞𝗌 𝐚𝗋𝐞 𝗍𝗁𝐞 𝐚𝗅𝗉𝗁𝐚𝖻𝐞𝗍 𝐨𝖿 𝗍𝗁𝐢𝗌 𝗉𝐚𝗋𝗍𝐢𝖼𝐮𝗅𝐚𝗋 𝗆𝐨𝖽𝐞.

𝗍𝗁𝐞 [𝗌𝐞𝐚𝗆 𝗅𝐨𝐨𝗆](seams/index.html) 𝗌𝗍𝐚𝗋𝗍𝗌 𝐚 𝗇𝐞𝗐, 𝖿𝗋𝐚𝗆𝐞𝖽 𝗉𝐚𝗌𝗌𝐚𝗀𝐞 𝖿𝗋𝐨𝗆 𝗉𝗅𝐚𝐢𝗇 𝗌𝐨𝐮𝗋𝖼𝐞. 𝗌𝐞𝗅𝐞𝖼𝗍𝐞𝖽-𝗅𝐞𝗍𝗍𝐞𝗋 𝗆𝐨𝖽𝐞𝗌 𝗄𝐞𝐞𝗉 𝗍𝗁𝐞𝐢𝗋 𝐞𝗑𝐚𝖼𝗍 𝖿𝐨𝗇𝗍 𝗋𝐨𝐮𝗍𝐢𝗇𝗀. 𝗐𝐢𝗍𝗁 𝗍𝗁𝐞 𝗌𝐞𝗅𝐞𝖼𝗍𝐞𝖽 𝗆𝐞𝗌𝗌𝐚𝗀𝐞 𝐞𝗆𝗉𝗍𝗒, 𝐚𝗅𝗅 78 𝗋𝐞𝗀𝐢𝗌𝗍𝐞𝗋 𝖼𝗁𝐨𝐢𝖼𝐞𝗌 𝐚𝗋𝐞 𝐚𝗏𝐚𝐢𝗅𝐚𝖻𝗅𝐞 𝖻𝐞𝗇𝐞𝐚𝗍𝗁 𝗀𝗁𝐨𝗌𝗍 𝗁𝐞𝗑 𝐚𝗇𝖽 𝗍𝗁𝐞 𝐢𝗇𝖽𝐞𝗉𝐞𝗇𝖽𝐞𝗇𝗍 𝗓𝐚𝗅𝗀𝐨 𝗆𝐚𝗋𝗄 𝖼𝗁𝐚𝗇𝗇𝐞𝗅𝗌. 𝗋𝐞𝐚𝖽 𝗆𝐚𝗋𝗄𝗌, 𝗍𝗁𝐞𝗇 𝗌𝐞𝗅𝐞𝖼𝗍𝐨𝗋𝗌, 𝗍𝗁𝐞𝗇 𝗍𝗁𝐞 𝖿𝐨𝗇𝗍 𝗉𝐚𝗍𝗁; 𝗍𝗁𝐞 𝗁𝐞𝗑𝗆𝐨𝗃𝐢 𝗃𝐞𝗐𝐞𝗅 𝗁𝐚𝗌 𝐢𝗍𝗌 𝐨𝗐𝗇 𝗋𝐞𝐚𝖽𝐢𝗇𝗀 𝖻𝐞𝗌𝐢𝖽𝐞 𝗍𝗁𝐞 𝗏𝐞𝗋𝗌𝐞.

𝗍𝗁𝐞 𝗋𝐞𝖼𝐨𝗏𝐞𝗋𝐞𝖽 𝗌𝐞𝗆𝐚𝗇𝗍𝐢𝖼 𝗏𝐞𝐢𝗅-𝗌𝖼𝗋𝐢𝗉𝗍 𝗏𝐨𝖼𝐚𝖻𝐮𝗅𝐚𝗋𝗒 𝗀𝐢𝗏𝐞𝗌 𝗋𝐞𝗀𝐢𝗌𝗍𝐞𝗋𝗌 𝗉𝐨𝐞𝗍𝐢𝖼 𝗋𝐨𝗅𝐞𝗌 𝐚𝗇𝖽 𝗏𝐨𝐢𝖼𝐞𝗌. 𝗀𝐚𝗋𝖽𝐞𝗇 𝗌𝐞𝐚𝗆𝗌 𝐮𝗌𝐞𝗌 𝗍𝗁𝐨𝗌𝐞 𝗋𝐨𝗅𝐞𝗌 𝐚𝗌 𝐚𝗋𝗍𝐢𝗌𝗍𝐢𝖼 𝗅𝐚𝗇𝗀𝐮𝐚𝗀𝐞; 𝗍𝗁𝐢𝗌 𝗉𝐚𝗌𝗌 𝖽𝐨𝐞𝗌 𝗇𝐨𝗍 𝐚𝖽𝖽 𝐚 𝗉𝐞𝗋𝗌𝐨𝗇𝐚 𝐞𝗇𝗀𝐢𝗇𝐞. 𝗍𝗁𝐞 𝗉𝗋𝐢𝗏𝐚𝗍𝐞 𝗌𝐞𝗆𝐚𝗇𝗍𝐢𝖼 𝖽𝗋𝐚𝖿𝗍 𝗌𝗍𝐚𝗒𝗌 𝐢𝗇 𝗍𝗁𝐞 𝗅𝐨𝖼𝐚𝗅 𝐚𝗋𝖼𝗁𝐢𝗏𝐞.
