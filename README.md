# ꧁𓃠꧂ 𝖿𝐨𝗇𝗍 𝗀𝐚𝗋𝖽𝐞𝗇 ꧁𓃠꧂

𝗍𝗁𝐞 𝗅𝐞𝗍𝗍𝐞𝗋 𝐢𝗌 𝐚 𝖻𝐨𝖽𝗒; 𝗍𝗁𝐞 𝗋𝐞𝗀𝐢𝗌𝗍𝐞𝗋 𝐢𝗌 𝐢𝗍𝗌 𝗏𝐨𝐢𝖼𝐞.

Open [the complete gallery](index.html), or the preserved [Veil-Script workshop v0.2.1](veil_script_font_garden_v0_2_1.html). No installation, network request or font download is needed.

The gallery exposes 78 choices: all 50 recovered workshop styles, both missing mathematical italic alphabets, 23 synthetic-register implementations, and three recovered wrapper/specimen ideas. It accepts custom Unicode text. The recovered workshop retains its original favorites, mixer, overlays, local storage and inspection tools.

This is a Unicode character workshop, not an installable typeface. The device's fonts decide the pixels. Decorative substitutions can lose case or collide with ordinary source symbols. The gallery's output is a styled carrier, not a cryptographic payload. Keep the original text when exact unstyled recovery matters.

The exact authored identity used around Lily's GitHub is `chaos-noodle-ii`: mathematical **bold** vowels (𝐚, 𝐞, 𝐢, 𝐨, 𝐮) and mathematical **sans-serif regular** consonants (𝖻, 𝖼, 𝖽…). Some older prose mislabeled the vowels “sans-serif bold”; the actual code points are preserved here.

## Recovered and new

- `veil_script_font_garden_v0_2_1.html`, `font-catalog-v0_2.md` and `veil_script_synthetic_registers_v1.json` are unchanged recovered originals.
- `font-registry-v0_2.json` preserves the Unicode-named catalog from the cipher documents; `archive/v0.1/` retains the fully reviewed older workshop. Its four source copies are byte-identical. The selected v0.2.1 repairs glyph segmentation and other old generator defects.
- `font-garden.js` extracts the existing 50-style catalog as a reusable browser API.
- `register-recipes.js` is new implementation of recovered design descriptions. See [versioned rules](REGISTERS.md) for choices the descriptions left open.
- Coral Asemic's dictionary is missing. Its menu choice is clearly labeled a literal specimen; it does not claim to translate arbitrary input.

Attribution: Lily of Ashwood and the collaborative source material recovered in `beloved-daemon-publishing-kit`, 2026-09-10. No license file was present in the recovered Font Garden bundle; a license decision remains for the public release. Historical artifacts are also retained in the workspace archive.

The new Zalgo MUX v3 workshop vendors these two catalog scripts so every register can be a carrier, including wrappers, symbols, existing accents and emoji. Its two independently verified payload channels are a separate codec from this visual gallery.

Fresh browser verification: all 78 cards load; custom Unicode, inert user text, filtering, exact clipboard/manual fallback and 390px mobile layout pass with no page errors or HTTP requests. Run `node tests/browser.cjs` with Playwright installed and optionally `GARDEN_CHROMIUM` pointing to a Chromium executable. Artifacts are ignored by Git.
