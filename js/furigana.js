/**
 * 食関連教科書 — 専門用語ふりがな（食育 MC 向け）
 */
const FURIGANA_TERMS = [
  ['食育基本法', 'しょくいくきほんほう'],
  ['地産地消', 'ちさんちしょう'],
  ['フードロス', 'ふーどろす'],
  ['食品ロス', 'しょくひんろす'],
  ['フードマイレージ', 'ふーどまいれーじ'],
  ['社会的促進効果', 'しゃかいてきそくしんこうか'],
  ['メイラード反応', 'めいらーどはんのう'],
  ['フード・ネオフォビア', 'ふーどねおふぉびあ'],
  ['新奇恐怖症', 'しんききょうふしょう'],
  ['テロワール', 'てろわーる'],
  ['ピュイゼ・メソッド', 'ぴゅいぜめそっど'],
  ['センサリーシェア', 'せんさりーしぇあ'],
  ['共食', 'きょうしょく'],
  ['孤食', 'こしょく'],
  ['個食', 'こしょく'],
  ['食物繊維', 'しょくもつせんい'],
  ['生活習慣病', 'せいかつしゅうかんびょう'],
  ['ユネスコ', 'ゆねすこ'],
  ['無形文化遺産', 'むけいぶんかいさん'],
  ['馳走', 'ちそう'],
  ['骨伝導', 'こつでんどう']
];

function applyDictionaryFurigana(text) {
  let result = text;
  for (const [term, reading] of FURIGANA_TERMS) {
    if (!result.includes(term)) continue;
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(re, `<ruby>${term}<rt>${reading}</rt></ruby>`);
  }
  return result;
}

function applyFurigana(text) {
  if (!text || typeof text !== 'string') return text;
  const segments = text.split(/(<ruby[\s\S]*?<\/ruby>|<[^>]+>)/g);
  return segments
    .map(segment => {
      if (/^<ruby[\s\S]*<\/ruby>$/.test(segment) || /^<[^>]+>$/.test(segment)) {
        return segment;
      }
      return applyDictionaryFurigana(segment);
    })
    .join('');
}
