/**
 * 食関連教科書ライブラリ — 教科書ビューア（果物インストラクター形式）
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'food-text-bookmarks';
  let bookmarks = loadBookmarks();
  let currentView = { type: 'library' };

  const pageContainer = document.getElementById('page-container');
  const tocNav = document.getElementById('toc-nav');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const reviewCount = document.getElementById('review-count');
  const topBarTitle = document.getElementById('top-bar-title');

  function getTextbook() {
    const genreId = currentView.genreId;
    if (!genreId) return null;
    return getTextbookForGenre(genreId);
  }

  function bookmarkKey(sectionId) {
    return `${currentView.genreId}:${sectionId}`;
  }

  function loadBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveBookmarks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    updateReviewCount();
    renderToc();
  }

  function toggleBookmark(sectionId) {
    if (!currentView.genreId) return;
    const key = bookmarkKey(sectionId);
    const idx = bookmarks.indexOf(key);
    if (idx >= 0) bookmarks.splice(idx, 1);
    else bookmarks.push(key);
    saveBookmarks();
  }

  function isBookmarked(sectionId) {
    if (!currentView.genreId) return false;
    return bookmarks.includes(bookmarkKey(sectionId));
  }

  function updateReviewCount() {
    reviewCount.textContent = bookmarks.length;
  }

  function findSectionInTextbook(textbook, sectionId) {
    if (!textbook) return null;
    for (const ch of textbook.chapters) {
      const sec = ch.sections.find(s => s.id === sectionId);
      if (sec) return { chapter: ch, section: sec, textbook };
    }
    return null;
  }

  function findSectionByBookmark(key) {
    const [genreId, sectionId] = key.split(':');
    const tb = getTextbookForGenre(genreId);
    const found = findSectionInTextbook(tb, sectionId);
    if (!found) return null;
    const genre = getGenre(genreId);
    return { ...found, genreId, genreLabel: genre ? genre.label : genreId };
  }

  function updateTopBar() {
    if (currentView.type === 'library') {
      topBarTitle.textContent = FOOD_LIBRARY.title;
    } else if (currentView.type === 'review') {
      topBarTitle.textContent = '復習リスト';
    } else {
      const tb = getTextbook();
      const genre = getGenre(currentView.genreId);
      topBarTitle.textContent = genre ? `${genre.label} — ${tb ? tb.title : ''}` : FOOD_LIBRARY.title;
    }
  }

  function navigate(view) {
    currentView = view;
    window.scrollTo(0, 0);

    if (view.type === 'library') renderLibrary();
    else if (view.type === 'textbook') renderTextbookHome();
    else if (view.type === 'chapter') renderChapter(view.chapterId);
    else if (view.type === 'section') renderSection(view.chapterId, view.sectionId);
    else if (view.type === 'review') renderReview();

    updateTopBar();
    updateTocActive();
    closeSidebarMobile();
  }

  function navigateToHash() {
    const hash = location.hash.slice(1);
    if (!hash) {
      navigate({ type: 'library' });
      return;
    }
    if (hash === 'review') {
      navigate({ type: 'review' });
      return;
    }

    const parts = hash.split('/').filter(Boolean);
    const genreId = parts[0];
    if (!getGenre(genreId) || !getTextbookForGenre(genreId)) {
      navigate({ type: 'library' });
      return;
    }

    if (parts.length === 1) {
      navigate({ type: 'textbook', genreId });
    } else if (parts.length === 2) {
      navigate({ type: 'chapter', genreId, chapterId: parts[1] });
    } else if (parts.length >= 3) {
      navigate({ type: 'section', genreId, chapterId: parts[1], sectionId: parts[2] });
    }
  }

  function setHash(view) {
    let hash = '';
    if (view.type === 'textbook') hash = view.genreId;
    else if (view.type === 'chapter') hash = `${view.genreId}/${view.chapterId}`;
    else if (view.type === 'section') hash = `${view.genreId}/${view.chapterId}/${view.sectionId}`;
    else if (view.type === 'review') hash = 'review';
    else hash = '';
    if (location.hash !== `#${hash}`) location.hash = hash;
  }

  function renderLibrary() {
    setHash({ type: 'library' });
    const genres = publishedGenres();

    pageContainer.innerHTML = `
      <div class="home-hero">
        <h1>${FOOD_LIBRARY.title}</h1>
        <p>${FOOD_LIBRARY.subtitle}</p>
        <div class="home-stats">
          <div class="home-stat">
            <span class="home-stat-num">${FOOD_LIBRARY.categories.length}</span>
            <span class="home-stat-label">カテゴリ</span>
          </div>
          <div class="home-stat">
            <span class="home-stat-num">${genres.length}</span>
            <span class="home-stat-label">ジャンル</span>
          </div>
          <div class="home-stat">
            <span class="home-stat-num">${bookmarks.length}</span>
            <span class="home-stat-label">復習リスト</span>
          </div>
        </div>
      </div>
      ${FOOD_LIBRARY.categories.map(cat => {
        const catGenres = genres.filter(g => g.categoryId === cat.id);
        if (catGenres.length === 0) return '';
        return `
          <section class="library-category">
            <h2 class="library-category-title">${cat.icon} ${fgPlain(cat.label)}</h2>
            <p class="library-category-desc">${fgPlain(cat.description)}</p>
            <div class="chapter-grid">
              ${catGenres.map(g => {
                const tb = getTextbookForGenre(g.id);
                const sections = tb ? tb.chapters.reduce((n, ch) => n + ch.sections.length, 0) : 0;
                return `
                  <div class="chapter-card genre-card" data-genre="${g.id}">
                    <div class="chapter-card-icon">${g.icon}</div>
                    <div class="chapter-card-num">ジャンル</div>
                    <div class="chapter-card-title">${fgPlain(g.label)}</div>
                    <div class="chapter-card-meta">${fgPlain(g.summary)}</div>
                    ${tb ? `<div class="chapter-card-meta">${tb.chapters.length}章 · ${sections}項目</div>` : ''}
                  </div>`;
              }).join('')}
            </div>
          </section>`;
      }).join('')}
    `;

    pageContainer.querySelectorAll('[data-genre]').forEach(card => {
      card.addEventListener('click', () => {
        navigate({ type: 'textbook', genreId: card.dataset.genre });
      });
    });
  }

  function renderTextbookHome() {
    const tb = getTextbook();
    if (!tb) return renderLibrary();
    setHash({ type: 'textbook', genreId: currentView.genreId });

    const totalSections = tb.chapters.reduce((n, ch) => n + ch.sections.length, 0);
    const genre = getGenre(currentView.genreId);

    pageContainer.innerHTML = `
      <div class="chapter-header">
        <span class="chapter-header-badge">${genre ? genre.icon : '📚'} ${genre ? fgPlain(genre.label) : ''}</span>
        <h1>${fgPlain(tb.title)}</h1>
        <p class="textbook-subtitle">${fg(tb.subtitle)}</p>
      </div>
      <div class="home-stats" style="margin:1.5rem 0 2rem;">
        <div class="home-stat">
          <span class="home-stat-num">${tb.chapters.length}</span>
          <span class="home-stat-label">章</span>
        </div>
        <div class="home-stat">
          <span class="home-stat-num">${totalSections}</span>
          <span class="home-stat-label">項目</span>
        </div>
      </div>
      <div class="chapter-grid">
        ${tb.chapters.map(ch => `
          <div class="chapter-card" data-chapter="${ch.id}">
            <div class="chapter-card-icon">${ch.icon}</div>
            <div class="chapter-card-num">${ch.badge ? `<span class="chapter-badge">${ch.badge}</span> ` : ''}第${ch.number}章</div>
            <div class="chapter-card-title">${fgPlain(ch.title)}</div>
            <div class="chapter-card-meta">${ch.sections.length}項目</div>
          </div>
        `).join('')}
      </div>
      <div class="section-nav">
        <a class="nav-btn" href="#" data-nav="library">🏠 ジャンル一覧に戻る</a>
      </div>
    `;

    pageContainer.querySelectorAll('.chapter-card[data-chapter]').forEach(card => {
      card.addEventListener('click', () => {
        navigate({ type: 'chapter', genreId: currentView.genreId, chapterId: card.dataset.chapter });
      });
    });
    bindNavEvents();
  }

  function renderChapter(chapterId) {
    const tb = getTextbook();
    if (!tb) return renderLibrary();
    const ch = tb.chapters.find(c => c.id === chapterId);
    if (!ch) return renderTextbookHome();
    setHash({ type: 'chapter', genreId: currentView.genreId, chapterId });

    pageContainer.innerHTML = `
      <div class="chapter-header">
        <span class="chapter-header-badge">${ch.icon} 第${ch.number}章${ch.badge ? ` <span class="chapter-badge-inline">${ch.badge}</span>` : ''}</span>
        <h1>${fgPlain(ch.title)}</h1>
      </div>
      <div class="chapter-toc">
        <h3>📋 この章の目次</h3>
        <ul class="chapter-toc-list">
          ${ch.sections.map((sec, i) => `
            <li>
              <a href="#" data-section="${sec.id}">
                <span>${ch.number}-${i + 1}.</span> ${fgPlain(sec.title)}
                ${sec.tags ? sec.tags.map(t => `<span class="tag tag-${tagClass(t)}">${t}</span>`).join('') : ''}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
      ${ch.sections.map((sec, i) => renderSectionBlock(ch, sec, i)).join('')}
      <div class="section-nav">
        <a class="nav-btn" href="#" data-nav="textbook">📚 教科書トップ</a>
        <a class="nav-btn" href="#" data-nav="library">🏠 ジャンル一覧</a>
        ${getAdjacentChapter(chapterId, -1)}
        ${getAdjacentChapter(chapterId, 1)}
      </div>
    `;

    bindSectionEvents(ch);
    bindNavEvents();
  }

  function renderSection(chapterId, sectionId) {
    const tb = getTextbook();
    if (!tb) return renderLibrary();
    const ch = tb.chapters.find(c => c.id === chapterId);
    if (!ch) return renderTextbookHome();
    const secIdx = ch.sections.findIndex(s => s.id === sectionId);
    if (secIdx < 0) return renderChapter(chapterId);
    const sec = ch.sections[secIdx];
    setHash({ type: 'section', genreId: currentView.genreId, chapterId, sectionId });

    pageContainer.innerHTML = `
      <div class="chapter-header">
        <span class="chapter-header-badge">${ch.icon} 第${ch.number}章${ch.badge ? ` <span class="chapter-badge-inline">${ch.badge}</span>` : ''}</span>
        <h1>${fgPlain(ch.title)}</h1>
      </div>
      ${renderSectionBlock(ch, sec, secIdx)}
      <div class="section-nav">
        <a class="nav-btn" href="#" data-nav="textbook">📚 教科書トップ</a>
        <a class="nav-btn" href="#" data-nav="chapter" data-chapter="${chapterId}">📖 第${ch.number}章に戻る</a>
        ${secIdx > 0 ? `<a class="nav-btn" href="#" data-nav="section" data-chapter="${chapterId}" data-section="${ch.sections[secIdx - 1].id}">← 前の項目</a>` : ''}
        ${secIdx < ch.sections.length - 1 ? `<a class="nav-btn" href="#" data-nav="section" data-chapter="${chapterId}" data-section="${ch.sections[secIdx + 1].id}">次の項目 →</a>` : ''}
      </div>
    `;

    bindSectionEvents(ch);
    bindNavEvents();
  }

  function renderSectionBlock(ch, sec, idx) {
    const bookmarked = isBookmarked(sec.id);
    return `
      <article class="section-block" id="${sec.id}">
        <div class="section-header">
          <div class="section-title-wrap">
            <div class="section-number">${ch.number}-${idx + 1}</div>
            <h2 class="section-title">${fgPlain(sec.title)}</h2>
            ${sec.tags ? `<div class="section-tags">${sec.tags.map(t => `<span class="tag tag-${tagClass(t)}">${t}</span>`).join('')}</div>` : ''}
          </div>
          <button class="bookmark-btn ${bookmarked ? 'active' : ''}" data-bookmark="${sec.id}" aria-label="復習リストに追加">
            ${bookmarked ? '⭐ 復習中' : '☆ 復習リストに追加'}
          </button>
        </div>
        <div class="section-content">
          ${sec.blocks.map(renderBlock).join('')}
        </div>
        <div class="section-nav">
          <a class="nav-btn" href="#" data-nav="chapter" data-chapter="${ch.id}">📖 第${ch.number}章に戻る</a>
          ${idx > 0 ? `<a class="nav-btn" href="#" data-nav="section" data-chapter="${ch.id}" data-section="${ch.sections[idx - 1].id}">← 前へ</a>` : ''}
          ${idx < ch.sections.length - 1 ? `<a class="nav-btn" href="#" data-nav="section" data-chapter="${ch.id}" data-section="${ch.sections[idx + 1].id}">次へ →</a>` : ''}
        </div>
      </article>
    `;
  }

  function renderReview() {
    setHash({ type: 'review' });

    if (bookmarks.length === 0) {
      pageContainer.innerHTML = `
        <div class="review-page">
          <h1>⭐ 復習リスト</h1>
          <div class="review-empty">
            <div class="review-empty-icon">📭</div>
            <p>復習リストは空です。</p>
            <p>各項目の「☆ 復習リストに追加」ボタンを押すと、ここに追加されます。</p>
            <br>
            <a class="nav-btn" href="#" data-nav="library">🏠 ジャンル一覧に戻る</a>
          </div>
        </div>
      `;
      bindNavEvents();
      return;
    }

    const items = bookmarks.map(key => {
      const found = findSectionByBookmark(key);
      if (!found) return '';
      const [, sectionId] = key.split(':');
      return `
        <li class="review-item" data-genre="${found.genreId}" data-chapter="${found.chapter.id}" data-section="${sectionId}">
          <div class="review-item-info">
            <div class="review-item-chapter">${fgPlain(found.genreLabel)} · 第${found.chapter.number}章</div>
            <div class="review-item-title">${fgPlain(found.section.title)}</div>
          </div>
          <button class="review-remove" data-remove="${key}" aria-label="復習リストから削除">✕</button>
        </li>
      `;
    }).join('');

    pageContainer.innerHTML = `
      <div class="review-page">
        <h1>⭐ 復習リスト（${bookmarks.length}件）</h1>
        <p style="color:var(--color-text-muted);margin-bottom:1.5rem;font-size:0.9rem;">復習したい項目をタップして内容を確認しましょう。</p>
        <ul class="review-list">${items}</ul>
        <div class="section-nav" style="margin-top:2rem;border-top:none;padding-top:0;">
          <a class="nav-btn" href="#" data-nav="library">🏠 ジャンル一覧に戻る</a>
        </div>
      </div>
    `;

    pageContainer.querySelectorAll('.review-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.review-remove')) return;
        navigate({
          type: 'section',
          genreId: item.dataset.genre,
          chapterId: item.dataset.chapter,
          sectionId: item.dataset.section
        });
      });
    });

    pageContainer.querySelectorAll('.review-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.remove;
        bookmarks = bookmarks.filter(b => b !== key);
        saveBookmarks();
        renderReview();
      });
    });

    bindNavEvents();
  }

  function renderBlock(block) {
    switch (block.type) {
      case 'lead': return `<p class="block-lead">${fg(block.text)}</p>`;
      case 'paragraph': return `<p class="block-paragraph">${fg(block.text)}</p>`;
      case 'callout':
        return `<div class="callout callout-${block.variant}"><div class="callout-title">${fgPlain(block.title)}</div><div class="callout-text">${fg(block.text)}</div></div>`;
      case 'compare':
        return `<h3 class="block-title">${fgPlain(block.title)}</h3><div class="compare-grid">${block.items.map(item => `
          <div class="compare-card ${item.color}">
            <div class="compare-label">${fgPlain(item.label)}</div>
            <div class="compare-sublabel">${fgPlain(item.sublabel)}</div>
            <ul>${item.points.map(p => `<li>${fg(p)}</li>`).join('')}</ul>
          </div>`).join('')}</div>`;
      case 'table':
        return `<h3 class="block-title">${fgPlain(block.title)}</h3>
          <div class="data-table-wrap"><table class="data-table ${block.highlight ? 'highlight' : ''}">
            <thead><tr>${block.headers.map(h => `<th>${fgPlain(h)}</th>`).join('')}</tr></thead>
            <tbody>${block.rows.map(row => `<tr>${row.map(cell => `<td>${fg(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table></div>`;
      case 'cards':
        return `${block.title ? `<h3 class="block-title">${fgPlain(block.title)}</h3>` : ''}<div class="info-cards">${block.items.map(card => `
          <div class="info-card ${card.color}">
            <div class="info-card-icon">${card.icon}</div>
            <div class="info-card-title">${fgPlain(card.title)}</div>
            <ul class="info-card-effects">${card.effects.map(e => `<li>${fg(e)}</li>`).join('')}</ul>
          </div>`).join('')}</div>`;
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        return `<h3 class="block-title">${fgPlain(block.title)}</h3><${tag} class="block-list">${block.items.map(i => `<li>${fg(i)}</li>`).join('')}</${tag}>`;
      }
      default: return '';
    }
  }

  function renderToc() {
    const inTextbook = currentView.genreId && getTextbook();
    const tb = inTextbook ? getTextbook() : null;

    if (!tb) {
      tocNav.innerHTML = `
        <button class="toc-chapter-btn" data-nav="library" style="margin-bottom:0.75rem;">🏠 ジャンル一覧</button>
        <p class="toc-library-label">ジャンルを選ぶ</p>
        ${publishedGenres().map(g => `
          <button class="toc-chapter-btn toc-genre-btn" data-genre="${g.id}">
            ${g.icon} ${fgPlain(g.label)}
          </button>
        `).join('')}
      `;
      tocNav.querySelector('[data-nav="library"]')?.addEventListener('click', () => navigate({ type: 'library' }));
      tocNav.querySelectorAll('[data-genre]').forEach(btn => {
        btn.addEventListener('click', () => navigate({ type: 'textbook', genreId: btn.dataset.genre }));
      });
      return;
    }

    tocNav.innerHTML = `
      <button class="toc-chapter-btn" data-nav="library" style="margin-bottom:0.35rem;">🏠 ジャンル一覧</button>
      <button class="toc-chapter-btn" data-nav="textbook" style="margin-bottom:0.75rem;">📚 この教科書トップ</button>
      ${tb.chapters.map(ch => `
        <div class="toc-chapter">
          <button class="toc-chapter-btn" data-chapter="${ch.id}">
            ${ch.icon} 第${ch.number}章${ch.badge ? ' ★' : ''}
          </button>
          <ul class="toc-sections">
            ${ch.sections.map(sec => `
              <li>
                <a class="toc-section-link ${isBookmarked(sec.id) ? 'bookmarked' : ''}" data-chapter="${ch.id}" data-section="${sec.id}">
                  ${fgPlain(sec.title.length > 22 ? sec.title.slice(0, 22) + '…' : sec.title)}
                  <span class="review-star">⭐</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    `;

    tocNav.querySelector('[data-nav="library"]').addEventListener('click', () => navigate({ type: 'library' }));
    tocNav.querySelector('[data-nav="textbook"]').addEventListener('click', () => navigate({ type: 'textbook', genreId: currentView.genreId }));

    tocNav.querySelectorAll('.toc-chapter-btn[data-chapter]').forEach(btn => {
      btn.addEventListener('click', () => navigate({ type: 'chapter', genreId: currentView.genreId, chapterId: btn.dataset.chapter }));
    });

    tocNav.querySelectorAll('.toc-section-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigate({
          type: 'section',
          genreId: currentView.genreId,
          chapterId: link.dataset.chapter,
          sectionId: link.dataset.section
        });
      });
    });
  }

  function updateTocActive() {
    renderToc();
    const tb = getTextbook();
    if (!tb) {
      if (currentView.type === 'library') {
        tocNav.querySelector('[data-nav="library"]')?.classList.add('active');
      } else if (currentView.type === 'textbook') {
        tocNav.querySelector(`[data-genre="${currentView.genreId}"]`)?.classList.add('active');
      }
      return;
    }

    tocNav.querySelectorAll('.toc-chapter-btn, .toc-section-link, .toc-genre-btn').forEach(el => el.classList.remove('active'));

    if (currentView.type === 'textbook') {
      tocNav.querySelector('[data-nav="textbook"]')?.classList.add('active');
    } else if (currentView.type === 'chapter') {
      tocNav.querySelector(`.toc-chapter-btn[data-chapter="${currentView.chapterId}"]`)?.classList.add('active');
    } else if (currentView.type === 'section') {
      tocNav.querySelector(`.toc-chapter-btn[data-chapter="${currentView.chapterId}"]`)?.classList.add('active');
      tocNav.querySelector(`.toc-section-link[data-section="${currentView.sectionId}"]`)?.classList.add('active');
    }
  }

  function bindSectionEvents(ch) {
    pageContainer.querySelectorAll('[data-bookmark]').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBookmark(btn.dataset.bookmark);
        const active = isBookmarked(btn.dataset.bookmark);
        btn.classList.toggle('active', active);
        btn.innerHTML = active ? '⭐ 復習中' : '☆ 復習リストに追加';
      });
    });

    pageContainer.querySelectorAll('.chapter-toc-list a[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById(link.dataset.section);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function bindNavEvents() {
    pageContainer.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const nav = el.dataset.nav;
        if (nav === 'library') navigate({ type: 'library' });
        else if (nav === 'textbook') navigate({ type: 'textbook', genreId: currentView.genreId });
        else if (nav === 'chapter') navigate({ type: 'chapter', genreId: currentView.genreId, chapterId: el.dataset.chapter });
        else if (nav === 'section') {
          navigate({
            type: 'section',
            genreId: currentView.genreId,
            chapterId: el.dataset.chapter,
            sectionId: el.dataset.section
          });
        }
      });
    });
  }

  function getAdjacentChapter(chapterId, dir) {
    const tb = getTextbook();
    if (!tb) return '';
    const idx = tb.chapters.findIndex(c => c.id === chapterId);
    const adj = tb.chapters[idx + dir];
    if (!adj) return '';
    const label = dir < 0 ? `← 第${adj.number}章` : `第${adj.number}章 →`;
    return `<a class="nav-btn" href="#" data-nav="chapter" data-chapter="${adj.id}">${label}</a>`;
  }

  function openSidebarMobile() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
  }

  function closeSidebarMobile() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  }

  document.getElementById('menu-toggle').addEventListener('click', openSidebarMobile);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebarMobile);
  sidebarOverlay.addEventListener('click', closeSidebarMobile);
  document.getElementById('review-btn').addEventListener('click', () => navigate({ type: 'review' }));

  function tagClass(tag) {
    if (tag === '必須' || tag === 'MC必須') return 'required';
    if (tag === '重要') return 'important';
    if (tag === '試験頻出') return 'exam';
    if (tag === 'トーク例') return 'exam';
    return 'important';
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function fgPlain(str) {
    if (str == null) return '';
    return typeof applyFurigana === 'function' ? applyFurigana(esc(String(str))) : esc(String(str));
  }

  function fg(str) {
    if (str == null) return '';
    return typeof applyFurigana === 'function' ? applyFurigana(String(str)) : String(str);
  }

  window.addEventListener('hashchange', navigateToHash);
  updateReviewCount();
  navigateToHash();
})();
