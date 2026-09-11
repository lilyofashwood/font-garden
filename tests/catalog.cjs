'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
require('../font-garden.js');

const source='A e\u0301 👩🏽‍💻 🇯🇵 1️⃣ क्ष 가';
for(const [style,expected] of [['mirror','가 क्ष 1️⃣ 🇯🇵 👩🏽‍💻 ɘ\u0301 ɒ'],['upside','가 क्ष 1️⃣ 🇯🇵 👩🏽‍💻 ǝ\u0301 ∀']]){
  test(style+' reverses whole graphemes and maps only their first code point',()=>{
    assert.equal(FontGarden.apply(style,source),expected);
    const segmenter=new Intl.Segmenter('en',{granularity:'grapheme'});
    assert.equal(Array.from(segmenter.segment(expected)).length,Array.from(segmenter.segment(source)).length);
  });
}
test('empty strings and single compound clusters stay intact',()=>{
  for(const style of ['mirror','upside'])for(const carrier of ['', '👩🏽‍💻','🇯🇵','1️⃣','क्ष','가'])assert.equal(FontGarden.apply(style,carrier),carrier);
});
test('without Intl or Intl.Segmenter, orientation returns unchanged source',()=>{
  const code=fs.readFileSync(path.join(__dirname,'../font-garden.js'),'utf8');
  for(const intl of [undefined,{}]){
    const context={Intl:intl};vm.runInNewContext(code,context);
    for(const style of ['mirror','upside'])assert.equal(context.FontGarden.apply(style,source),source);
  }
});
