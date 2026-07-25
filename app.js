(() => {
  const STORAGE_KEY = 'n5cho-favorites';

  const el = {
    lessonSelect: document.getElementById('lessonSelect'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    favToggle: document.getElementById('favToggle'),
    deckCount: document.getElementById('deckCount'),
    lessonLabel: document.getElementById('lessonLabel'),
    progressFill: document.getElementById('progressFill'),
    cardCounter: document.getElementById('cardCounter'),
    emptyState: document.getElementById('emptyState'),
    emptyReset: document.getElementById('emptyReset'),
    stage: document.getElementById('stage'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    card: document.getElementById('card'),
    cardInner: document.getElementById('cardInner'),
    frontLesson: document.getElementById('frontLesson'),
    backLesson: document.getElementById('backLesson'),
    favStar: document.getElementById('favStar'),
    kanjiDisplay: document.getElementById('kanjiDisplay'),
    hiraganaDisplay: document.getElementById('hiraganaDisplay'),
    romajiDisplay: document.getElementById('romajiDisplay'),
    meaningDisplay: document.getElementById('meaningDisplay'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    flipBtn: document.getElementById('flipBtn'),
    restartBtn: document.getElementById('restartBtn'),
    favCount: document.getElementById('favCount'),
  };

  // ---------- State ----------
  let favorites = loadFavorites();
  let lesson = 'all';
  let query = '';
  let favOnly = false;
  let deck = [];
  let order = [];      // array of indices into `deck`, possibly shuffled
  let pos = 0;          // position within `order`
  let flipped = false;

  function loadFavorites(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    }catch(e){ return new Set(); }
  }
  function saveFavorites(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites])); }catch(e){}
  }

  // ---------- Setup lesson dropdown ----------
  function initLessonSelect(){
    const lessons = [...new Set(VOCAB_DATA.map(w => w.lesson))].sort((a,b) => a-b);
    const optAll = document.createElement('option');
    optAll.value = 'all';
    optAll.textContent = `All lessons (${VOCAB_DATA.length})`;
    el.lessonSelect.appendChild(optAll);
    lessons.forEach(n => {
      const count = VOCAB_DATA.filter(w => w.lesson === n).length;
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = `Lesson ${n} (${count})`;
      el.lessonSelect.appendChild(opt);
    });
  }

  // ---------- Filtering ----------
  function normalize(s){ return (s || '').toLowerCase(); }

  function computeDeck(){
    const q = normalize(query.trim());
    deck = VOCAB_DATA.filter(w => {
      if (lesson !== 'all' && w.lesson !== Number(lesson)) return false;
      if (favOnly && !favorites.has(w.id)) return false;
      if (q){
        const hay = normalize(w.kanji) + ' ' + normalize(w.hiragana) + ' ' + normalize(w.romaji) + ' ' + normalize(w.meaning);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    order = deck.map((_, i) => i);
    pos = 0;
  }

  function shuffleOrder(){
    for (let i = order.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    pos = 0;
    render();
  }

  // ---------- Rendering ----------
  function currentWord(){
    if (!deck.length) return null;
    return deck[order[pos]];
  }

  function render(){
    const total = deck.length;
    const isEmpty = total === 0;
    el.emptyState.hidden = !isEmpty;
    el.stage.hidden = isEmpty;
    document.querySelector('.deck-controls').style.display = isEmpty ? 'none' : '';

    el.deckCount.textContent = `${total} word${total === 1 ? '' : 's'}`;
    el.lessonLabel.textContent = lesson === 'all' ? 'All lessons' : `Lesson ${lesson}`;
    el.favCount.textContent = `${favorites.size} favorited`;

    if (isEmpty){
      el.cardCounter.textContent = '0 / 0';
      el.progressFill.style.width = '0%';
      return;
    }

    const w = currentWord();
    el.cardCounter.textContent = `${pos + 1} / ${total}`;
    el.progressFill.style.width = `${((pos + 1) / total) * 100}%`;

    // Some source rows use a placeholder dash instead of leaving kanji blank — treat those as "no kanji" too.
    const DASH_PLACEHOLDERS = new Set(['—', '-', 'ー', '−', '‐', '']);
    const hasKanji = !DASH_PLACEHOLDERS.has(w.kanji.trim());

    const displayGlyph = hasKanji ? w.kanji : w.hiragana;
    el.kanjiDisplay.textContent = displayGlyph;
    el.kanjiDisplay.style.fontSize = displayGlyph.length > 4 ? '38px' : (displayGlyph.length > 2 ? '50px' : '64px');
    el.hiraganaDisplay.textContent = hasKanji ? w.hiragana : '';
    el.hiraganaDisplay.style.visibility = hasKanji ? 'visible' : 'hidden';

    el.romajiDisplay.textContent = w.romaji;
    el.meaningDisplay.textContent = w.meaning || '—';
    el.frontLesson.textContent = `L.${w.lesson}`;
    el.backLesson.textContent = `L.${w.lesson}`;

    const isFav = favorites.has(w.id);
    el.favStar.setAttribute('aria-pressed', String(isFav));

    el.prevBtn.disabled = pos === 0;
    el.nextBtn.disabled = pos === total - 1;

    setFlipped(false, true);
  }

  function setFlipped(val, skipAnim){
    flipped = val;
    if (skipAnim) el.card.classList.add('no-anim');
    el.card.classList.toggle('is-flipped', flipped);
    if (skipAnim) requestAnimationFrame(() => el.card.classList.remove('no-anim'));
  }

  // ---------- Navigation ----------
  function go(delta){
    if (!deck.length) return;
    const next = pos + delta;
    if (next < 0 || next >= deck.length) return;
    pos = next;
    render();
  }

  function toggleFavorite(){
    const w = currentWord();
    if (!w) return;
    if (favorites.has(w.id)) favorites.delete(w.id);
    else favorites.add(w.id);
    saveFavorites();
    el.favStar.setAttribute('aria-pressed', String(favorites.has(w.id)));
    el.favCount.textContent = `${favorites.size} favorited`;
    if (favOnly) { computeDeck(); render(); }
  }

  function resetFilters(){
    lesson = 'all';
    query = '';
    favOnly = false;
    el.lessonSelect.value = 'all';
    el.searchInput.value = '';
    el.clearSearch.hidden = true;
    el.favToggle.setAttribute('aria-pressed', 'false');
    computeDeck();
    render();
  }

  // ---------- Events ----------
  el.lessonSelect.addEventListener('change', () => {
    lesson = el.lessonSelect.value;
    computeDeck();
    render();
  });

  let searchDebounce;
  el.searchInput.addEventListener('input', () => {
    el.clearSearch.hidden = el.searchInput.value.length === 0;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      query = el.searchInput.value;
      computeDeck();
      render();
    }, 140);
  });
  el.clearSearch.addEventListener('click', () => {
    el.searchInput.value = '';
    el.clearSearch.hidden = true;
    query = '';
    computeDeck();
    render();
    el.searchInput.focus();
  });

  el.favToggle.addEventListener('click', () => {
    favOnly = !favOnly;
    el.favToggle.setAttribute('aria-pressed', String(favOnly));
    computeDeck();
    render();
  });

  el.card.addEventListener('click', () => setFlipped(!flipped));
  el.flipBtn.addEventListener('click', () => setFlipped(!flipped));
  el.prevBtn.addEventListener('click', () => go(-1));
  el.nextBtn.addEventListener('click', () => go(1));
  el.shuffleBtn.addEventListener('click', shuffleOrder);
  el.restartBtn.addEventListener('click', () => { pos = 0; render(); });
  el.favStar.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(); });
  el.emptyReset.addEventListener('click', resetFilters);

  document.addEventListener('keydown', (e) => {
    if (document.activeElement === el.searchInput) {
      if (e.key === 'Escape') el.searchInput.blur();
      return;
    }
    switch (e.key) {
      case 'ArrowLeft': go(-1); break;
      case 'ArrowRight': go(1); break;
      case ' ': case 'Enter': e.preventDefault(); setFlipped(!flipped); break;
      case 'f': case 'F': toggleFavorite(); break;
      case 's': case 'S': shuffleOrder(); break;
      default: break;
    }
  });

  // Basic touch swipe on card
  let touchStartX = null;
  el.card.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, {passive:true});
  el.card.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? go(1) : go(-1); }
    touchStartX = null;
  }, {passive:true});

  // ---------- Init ----------
  initLessonSelect();
  computeDeck();
  render();
})();
