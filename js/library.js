/**
 * 食関連教科書ライブラリ — カテゴリ・ジャンル定義
 * config/genres.json と内容を揃えて更新してください
 */
const FOOD_LIBRARY = {
  title: '食関連教科書ライブラリ',
  subtitle: 'ジャンル別に学べる、現場向けの食テキスト',

  categories: [
    {
      id: 'vocational',
      label: '職関連',
      description: '仕事・資格・現場実践に直結する食関連の教科書',
      icon: '💼'
    }
  ],

  genres: [
    {
      id: 'shokuiku',
      categoryId: 'vocational',
      label: '食育',
      icon: '🥗',
      summary: 'グルメフェス向け食育トークショー MC 実践と知識のまとめ',
      status: 'published',
      textbookKey: 'shokuiku'
    }
  ]
};

/** @type {Record<string, object>} */
const TEXTBOOKS = {
  shokuiku: typeof SHOKUIKU_TEXTBOOK !== 'undefined' ? SHOKUIKU_TEXTBOOK : null
};

function getGenre(genreId) {
  return FOOD_LIBRARY.genres.find(g => g.id === genreId);
}

function getTextbookForGenre(genreId) {
  const genre = getGenre(genreId);
  if (!genre) return null;
  return TEXTBOOKS[genre.textbookKey] || null;
}

function publishedGenres() {
  return FOOD_LIBRARY.genres.filter(g => g.status === 'published' && TEXTBOOKS[g.textbookKey]);
}
