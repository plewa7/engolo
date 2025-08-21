import "./dictionary.css";

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
    }>;
  }>;
}

export class Dictionary extends HTMLElement {
  private searchInput: HTMLInputElement | null = null;
  private resultsContainer: HTMLElement | null = null;
  private loadingIndicator: HTMLElement | null = null;
  private currentWord: string = '';
  private audioUrl: string = '';
  private favoriteWords: Set<string> = new Set();

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    
    // Załaduj ulubione słowa
    const favorites = this.getFavoriteWords();
    this.favoriteWords = new Set(favorites);
    
    // Załaduj głosy dla speech synthesis
    if ('speechSynthesis' in window) {
      // Głosy mogą nie być dostępne od razu
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          console.log('Speech synthesis voices loaded');
        });
      }
    }
  }

  render() {
    this.innerHTML = `
      <div class="dictionary-container">
        <div class="dictionary-header">
          <h3>Słownik angielsko-polski</h3>
          <p>Naucz się angielskiego: definicje, tłumaczenia, wymowa i gry</p>
        </div>
        
        <div class="dictionary-tabs">
          <button class="tab-btn active" data-tab="search">🔍 Wyszukaj</button>
          <button class="tab-btn" data-tab="translate">🌐 Tłumacz</button>
          <button class="tab-btn" data-tab="favorites">⭐ Ulubione</button>
          <button class="tab-btn" data-tab="history">📚 Historia</button>
          <button class="tab-btn" data-tab="games">🎮 Gry</button>
        </div>

        <div class="tab-content" id="search-tab">
          <div class="search-section">
            <div class="search-input-container">
              <input 
                type="text" 
                id="word-search" 
                placeholder="Wprowadź słowo angielskie..." 
                autocomplete="off"
              />
              <button id="search-btn" type="button">
                <span>🔍</span>
              </button>
            </div>
          </div>

          <div id="loading" class="loading hidden">
            <div class="spinner"></div>
            <p>Wyszukiwanie...</p>
          </div>

          <div id="results" class="results-container"></div>
        </div>

        <div class="tab-content hidden" id="translate-tab">
          <div class="translate-section">
            <div class="translate-controls">
              <div class="translate-input-container">
                <textarea id="translate-input" placeholder="Wpisz tekst po polsku lub angielsku - automatycznie wykryję język i przetłumaczę..."></textarea>
                <button id="translate-btn" type="button">Tłumacz</button>
              </div>
            </div>
            
            <div id="translate-result" class="translate-result"></div>
          </div>
        </div>

        <div class="tab-content hidden" id="favorites-tab">
          <div class="favorites-section">
            <div class="section-header">
              <h4>Ulubione słowa</h4>
              <button id="clear-favorites" class="btn-secondary">�️ Wyczyść</button>
            </div>
            <div id="favorites-list" class="favorites-list"></div>
          </div>
        </div>

        <div class="tab-content hidden" id="history-tab">
          <div class="history-section">
            <div class="section-header">
              <h4>Historia wyszukiwań</h4>
              <button id="clear-history" class="btn-secondary">🗑️ Wyczyść</button>
            </div>
            <div id="history-list" class="history-list"></div>
          </div>
        </div>

        <div class="tab-content hidden" id="games-tab">
          <div class="games-section">
            <h4>Gry językowe</h4>
            
            <div class="game-card">
              <h5>🎯 Losowe słowo</h5>
              <p>Odkryj nowe słownictwo z definicjami</p>
              <button id="random-word" class="btn-primary">Losuj słowo</button>
            </div>

            <div class="game-card">
              <h5>📝 Słowo dnia</h5>
              <p>Naucz się czegoś nowego każdego dnia</p>
              <button id="word-of-day" class="btn-primary">Słowo dnia</button>
            </div>

            <div class="game-card">
              <h5>🎮 Quiz definicji</h5>
              <p>Sprawdź swoją wiedzę o ulubionych słowach</p>
              <button id="start-quiz" class="btn-primary">Rozpocznij quiz</button>
            </div>

            <div class="game-card">
              <h5>🔤 Memory słów</h5>
              <p>Gra memory z tłumaczeniami</p>
              <button id="memory-game" class="btn-primary">Zagraj w memory</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.searchInput = this.querySelector('#word-search');
    this.resultsContainer = this.querySelector('#results');
    this.loadingIndicator = this.querySelector('#loading');

    this.loadFavorites();
    this.loadRecentSearches();
    this.attachTabListeners();
  }

  attachEventListeners() {
    const searchBtn = this.querySelector('#search-btn');
    const searchInput = this.querySelector('#word-search') as HTMLInputElement;

    searchBtn?.addEventListener('click', () => this.handleSearch());
    
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });

    searchInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value.length > 2) {
        this.debounceSearch(target.value);
      }
    });
  }

  private debounceTimeout: number | null = null;

  debounceSearch(word: string) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = window.setTimeout(() => {
      this.searchWord(word);
    }, 500);
  }

  async handleSearch() {
    const word = this.searchInput?.value.trim();
    if (!word) return;

    await this.searchWord(word);
  }

  async searchWord(word: string) {
    if (!word || word.length < 2) return;

    this.showLoading(true);
    this.clearResults();

    try {
      // Używamy Free Dictionary API jako alternatywy dla Oxford API
      // Oxford API wymaga klucza i jest płatne
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        throw new Error('Słowo nie zostało znalezione');
      }

      const data = await response.json();
      this.displayResults(data);
      this.saveToRecentSearches(word);
      
    } catch (error) {
      this.displayError(error instanceof Error ? error.message : 'Wystąpił błąd podczas wyszukiwania');
    } finally {
      this.showLoading(false);
    }
  }

  displayResults(entries: DictionaryEntry[]) {
    if (!this.resultsContainer || !entries.length) return;

    const entry = entries[0]; // Bierzemy pierwszy wynik
    this.currentWord = entry.word;
    
    // Szukamy URL audio w phonetics
    const phonetics = (entry as any).phonetics || [];
    this.audioUrl = '';
    for (const phonetic of phonetics) {
      if (phonetic.audio && phonetic.audio.trim()) {
        this.audioUrl = phonetic.audio;
        break;
      }
    }
    
    const resultHTML = `
      <div class="word-entry">
        <div class="word-header">
          <h3 class="word-title">${entry.word}</h3>
          ${entry.phonetic ? `<span class="phonetic">${entry.phonetic}</span>` : ''}
          <div class="word-actions">
            <button class="pronunciation-btn" data-word="${entry.word}">
              🔊
            </button>
            <button class="favorite-btn ${this.favoriteWords.has(entry.word) ? 'favorited' : ''}" 
                    data-word="${entry.word}">
              ${this.favoriteWords.has(entry.word) ? '⭐' : '☆'}
            </button>
          </div>
          ${this.audioUrl ? `<audio id="word-audio" preload="none"><source src="${this.audioUrl}" type="audio/mpeg"></audio>` : ''}
        </div>

        ${this.renderMeanings(entry.meanings)}
      </div>
    `;

    this.resultsContainer.innerHTML = resultHTML;
    
    // Dodaj event listener dla przycisku pronunciation
    const pronunciationBtn = this.querySelector('.pronunciation-btn');
    pronunciationBtn?.addEventListener('click', () => this.playPronunciation());
    
    // Dodaj event listener dla przycisku favorite
    const favoriteBtn = this.querySelector('.favorite-btn');
    favoriteBtn?.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const word = target.dataset.word;
      if (word) {
        this.toggleFavorite(word);
      }
    });
  }

  toggleFavorite(word: string) {
    if (this.favoriteWords.has(word)) {
      this.removeFavorite(word);
    } else {
      this.addToFavorites(word);
    }
    
    // Aktualizuj przycisk
    const favoriteBtn = this.querySelector('.favorite-btn') as HTMLButtonElement;
    if (favoriteBtn) {
      favoriteBtn.textContent = this.favoriteWords.has(word) ? '⭐' : '☆';
      favoriteBtn.classList.toggle('favorited', this.favoriteWords.has(word));
    }
  }

  renderMeanings(meanings: DictionaryEntry['meanings']): string {
    return meanings.map(meaning => `
      <div class="meaning-section">
        <h4 class="part-of-speech">${meaning.partOfSpeech}</h4>
        <div class="definitions">
          ${meaning.definitions.map((def, index) => `
            <div class="definition-item">
              <div class="definition-number">${index + 1}.</div>
              <div class="definition-content">
                <p class="definition">${def.definition}</p>
                ${def.example ? `<p class="example"><em>"${def.example}"</em></p>` : ''}
                ${def.synonyms && def.synonyms.length > 0 ? 
                  `<div class="synonyms">
                    <strong>Synonimy:</strong> ${def.synonyms.slice(0, 5).join(', ')}
                  </div>` : ''
                }
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  displayError(message: string) {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = `
      <div class="error-message">
        <div class="error-icon">❌</div>
        <p>${message}</p>
        <p class="error-suggestion">Spróbuj sprawdzić pisownię lub wyszukaj inne słowo.</p>
      </div>
    `;
  }

  showLoading(show: boolean) {
    if (!this.loadingIndicator) return;
    
    if (show) {
      this.loadingIndicator.classList.remove('hidden');
    } else {
      this.loadingIndicator.classList.add('hidden');
    }
  }

  clearResults() {
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = '';
    }
  }

  saveToRecentSearches(word: string) {
    const recent = this.getRecentSearches();
    const updatedRecent = [word, ...recent.filter(w => w !== word)].slice(0, 10);
    localStorage.setItem('recentDictionarySearches', JSON.stringify(updatedRecent));
    this.loadRecentSearches();
  }

  getRecentSearches(): string[] {
    try {
      const recent = localStorage.getItem('recentDictionarySearches');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  }

  loadRecentSearches() {
    const recentList = this.querySelector('#history-list');
    if (!recentList) return;

    const recent = this.getRecentSearches();
    
    if (recent.length === 0) {
      recentList.innerHTML = '<p class="no-recent">Brak ostatnich wyszukiwań</p>';
      return;
    }

    recentList.innerHTML = recent.map(word => `
      <div class="history-item">
        <span class="recent-word" data-word="${word}">
          ${word}
        </span>
      </div>
    `).join('');

    // Dodaj event listenery dla kliknięć
    recentList.querySelectorAll('.recent-word').forEach(element => {
      element.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const word = target.dataset.word;
        if (word) {
          this.searchWordFromHistory(word);
        }
      });
    });
  }

  searchWordFromHistory(word: string) {
    // Przełącz na tab wyszukiwania
    const searchTab = this.querySelector('[data-tab="search"]') as HTMLButtonElement;
    searchTab?.click();
    
    // Ustaw słowo w input i wyszukaj
    if (this.searchInput) {
      this.searchInput.value = word;
      this.searchWord(word);
    }
  }

  searchRecentWord(word: string) {
    if (this.searchInput) {
      this.searchInput.value = word;
      this.searchWord(word);
    }
  }

  attachTabListeners() {
    const tabButtons = this.querySelectorAll('.tab-btn');
    const tabContents = this.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const tabName = target.dataset.tab;

        // Usuń active z wszystkich tabów
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        // Aktywuj wybrany tab
        target.classList.add('active');
        const tabContent = this.querySelector(`#${tabName}-tab`);
        tabContent?.classList.remove('hidden');

        // Załaduj zawartość taba
        this.loadTabContent(tabName || 'search');
      });
    });

    // Event listenery dla nowych przycisków
    this.querySelector('#clear-favorites')?.addEventListener('click', () => this.clearFavorites());
    this.querySelector('#clear-history')?.addEventListener('click', () => this.clearHistory());
    this.querySelector('#random-word')?.addEventListener('click', () => this.getRandomWord());
    this.querySelector('#word-of-day')?.addEventListener('click', () => this.getWordOfDay());
    this.querySelector('#start-quiz')?.addEventListener('click', () => this.startQuiz());
    this.querySelector('#memory-game')?.addEventListener('click', () => this.startMemoryGame());
    
    // Tłumaczenia
    this.querySelector('#translate-btn')?.addEventListener('click', () => this.translateText());
    
    // Enter w polu tłumaczenia
    this.querySelector('#translate-input')?.addEventListener('keypress', (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
        e.preventDefault();
        this.translateText();
      }
    });
  }

  loadTabContent(tabName: string) {
    switch (tabName) {
      case 'favorites':
        this.loadFavorites();
        break;
      case 'history':
        this.loadRecentSearches();
        break;
      case 'translate':
        // Translate tab jest gotowy
        break;
      case 'games':
        // Games tab jest gotowy
        break;
    }
  }

  loadFavorites() {
    const favorites = this.getFavoriteWords();
    const favoritesList = this.querySelector('#favorites-list');
    
    if (!favoritesList) return;

    if (favorites.length === 0) {
      favoritesList.innerHTML = '<p class="no-favorites">Brak ulubionych słów. Dodaj słowa klikając ⭐ podczas wyszukiwania.</p>';
      return;
    }

    favoritesList.innerHTML = favorites.map(word => `
      <div class="favorite-item">
        <span class="favorite-word" data-word="${word}">
          ${word}
        </span>
        <button class="remove-favorite" data-word="${word}">🗑️</button>
      </div>
    `).join('');

    // Dodaj event listenery dla usuwania i kliknięć
    favoritesList.querySelectorAll('.remove-favorite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const word = target.dataset.word;
        if (word) {
          this.removeFavorite(word);
          this.loadFavorites();
        }
      });
    });

    // Event listenery dla kliknięć w słowa
    favoritesList.querySelectorAll('.favorite-word').forEach(element => {
      element.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const word = target.dataset.word;
        if (word) {
          this.searchWordFromHistory(word);
        }
      });
    });
  }

  getFavoriteWords(): string[] {
    try {
      const favorites = localStorage.getItem('favoriteDictionaryWords');
      return favorites ? JSON.parse(favorites) : [];
    } catch {
      return [];
    }
  }

  addToFavorites(word: string) {
    const favorites = this.getFavoriteWords();
    if (!favorites.includes(word)) {
      favorites.push(word);
      localStorage.setItem('favoriteDictionaryWords', JSON.stringify(favorites));
      this.favoriteWords.add(word);
    }
  }

  removeFavorite(word: string) {
    const favorites = this.getFavoriteWords();
    const index = favorites.indexOf(word);
    if (index > -1) {
      favorites.splice(index, 1);
      localStorage.setItem('favoriteDictionaryWords', JSON.stringify(favorites));
      this.favoriteWords.delete(word);
    }
  }

  clearFavorites() {
    if (confirm('Czy na pewno chcesz wyczyścić wszystkie ulubione słowa?')) {
      localStorage.removeItem('favoriteDictionaryWords');
      this.favoriteWords.clear();
      this.loadFavorites();
    }
  }

  async translateText() {
    const input = this.querySelector('#translate-input') as HTMLTextAreaElement;
    const resultDiv = this.querySelector('#translate-result');
    
    if (!input?.value.trim() || !resultDiv) return;

    const text = input.value.trim();
    
    try {
      resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Wykrywanie języka i tłumaczenie...</p></div>';
      
      // Automatyczne wykrywanie języka na podstawie znaków
      const sourceLang = this.detectLanguage(text);
      const targetLang = sourceLang === 'pl' ? 'en' : 'pl';
      
      // Używamy MyMemory API (darmowe, obsługuje CORS)
      const langPair = `${sourceLang}|${targetLang}`;
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`);

      if (!response.ok) {
        throw new Error('Błąd tłumaczenia');
      }

      const data = await response.json();
      
      if (data.responseStatus === 200) {
        const translatedText = data.responseData.translatedText;
        
        resultDiv.innerHTML = `
          <div class="translation-result">
            <div class="source-text">
              <h5>Tekst źródłowy (${this.getLanguageName(sourceLang)}) - wykryto automatycznie:</h5>
              <p>${text}</p>
            </div>
            <div class="translated-text">
              <h5>Tłumaczenie (${this.getLanguageName(targetLang)}):</h5>
              <p>${translatedText}</p>
              <button class="copy-translation" onclick="navigator.clipboard.writeText('${translatedText.replace(/'/g, "\\'")}')">
                📋 Kopiuj
              </button>
            </div>
          </div>
        `;
      } else {
        throw new Error(data.responseDetails || 'Błąd tłumaczenia');
      }
      
    } catch (error) {
      console.error('Translation error:', error);
      resultDiv.innerHTML = `
        <div class="translation-error">
          <p>❌ Nie udało się przetłumaczyć tekstu</p>
          <p>Sprawdź połączenie internetowe lub spróbuj ponownie</p>
          <small>Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}</small>
        </div>
      `;
    }
  }

  detectLanguage(text: string): 'pl' | 'en' {
    // Polskie znaki diakrytyczne
    const polishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
    
    // Typowe polskie słowa (bardziej specyficzne)
    const polishWords = /\b(się|że|lub|oraz|przez|pod|nad|przy|bez|dla|jako|więc|tylko|już|też|bardzo|może|będzie|były|była|było|były|jego|jej|ich|które|która|który|nasz|nasza|nasze|moja|moje|jeden|jedna|jedno|tego|tych|tym|tej|temu|wszystko|wszystkie|wszystkich|każdy|każda|każde|gdzie|dlaczego|dlatego|ponieważ)\b/gi;
    
    // Typowe angielskie słowa (bardziej charakterystyczne)
    const englishWords = /\b(the|and|are|you|that|this|have|has|had|with|they|them|their|there|where|what|when|would|could|should|will|can|must|been|being|does|did|your|yours|mine|ours|theirs|these|those|some|any|many|much|very|only|just|also|even|still|here|now|then|than|from|into|onto|upon|about|above|below|under|over|between|among|through|during|before|after|since|until|while|because|although|however|therefore|moreover|furthermore|nevertheless|meanwhile|otherwise|instead|besides|except|unless|whether|though|thus|hence|indeed|perhaps|maybe|probably|certainly|definitely|obviously|clearly|apparently|supposedly|allegedly|presumably|basically|essentially|actually|really|truly|literally|virtually|practically|generally|usually|normally|typically|often|sometimes|rarely|never|always|already|yet|still|again|once|twice|first|last|next|previous|another|other|same|different|new|old|good|bad|big|small|long|short|high|low|fast|slow|easy|hard|early|late|right|wrong|true|false|yes|no)\b/gi;
    
    // Sprawdź polskie znaki diakrytyczne - jeśli są, to na pewno polski
    if (polishChars.test(text)) {
      return 'pl';
    }
    
    // Policz wystąpienia charakterystycznych słów
    const polishMatches = (text.match(polishWords) || []).length;
    const englishMatches = (text.match(englishWords) || []).length;
    
    // Sprawdź długość tekstu
    const textLength = text.split(/\s+/).length;
    
    // Dla krótkich tekstów (1-3 słowa) bądź bardziej ostrożny
    if (textLength <= 3) {
      // Sprawdź specyficzne angielskie konstrukcje
      if (/\b(i\s+am|you\s+are|he\s+is|she\s+is|it\s+is|we\s+are|they\s+are|i\s+have|you\s+have|have\s+to|going\s+to)\b/gi.test(text)) {
        return 'en';
      }
      
      // Sprawdź specyficzne polskie konstrukcje
      if (/\b(jestem|jesteś|jest|jesteśmy|jesteście|są|mam|masz|ma|mamy|macie|mają|będę|będziesz|będzie|będziemy|będziecie|będą)\b/gi.test(text)) {
        return 'pl';
      }
    }
    
    // Jeśli znaleziono angielskie słowa, a nie ma polskich
    if (englishMatches > 0 && polishMatches === 0) {
      return 'en';
    }
    
    // Jeśli znaleziono polskie słowa, a nie ma angielskich  
    if (polishMatches > 0 && englishMatches === 0) {
      return 'pl';
    }
    
    // Sprawdź proporcje - jeśli znacznie więcej angielskich słów
    if (englishMatches > polishMatches * 2) {
      return 'en';
    }
    
    // Sprawdź proporcje - jeśli więcej polskich słów
    if (polishMatches > englishMatches) {
      return 'pl';
    }
    
    // Sprawdź typowe angielskie wzorce
    if (/\b(to\s+go|to\s+be|to\s+have|to\s+do|i\s+\w+|you\s+\w+)\b/gi.test(text)) {
      return 'en';
    }
    
    // Domyślnie angielski dla nieokreślonych przypadków (częściej używany w nauce)
    return 'en';
  }

  getLanguageName(code: string): string {
    const languages: {[key: string]: string} = {
      'en': 'Angielski',
      'pl': 'Polski'
    };
    return languages[code] || code;
  }

  exportFavorites() {
    const favorites = this.getFavoriteWords();
    if (favorites.length === 0) {
      alert('Brak słów do eksportu');
      return;
    }

    const content = favorites.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ulubione-slowa.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearHistory() {
    if (confirm('Czy na pewno chcesz wyczyścić historię wyszukiwań?')) {
      localStorage.removeItem('recentDictionarySearches');
      this.loadRecentSearches();
    }
  }

  async getRandomWord() {
    let randomWord: string = '';
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        let response = await fetch('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=1000&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=4&maxLength=15&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5');
        
        if (!response.ok) {
          response = await fetch('https://random-words-api.vercel.app/word');
        }
        
        if (response.ok) {
          const data = await response.json();
          const candidateWord = data.word || data[0]?.word;
          
          // Sprawdź czy słowo ma definicję w Free Dictionary API
          if (candidateWord && candidateWord.length > 2 && !candidateWord.includes(' ')) {
            const testResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(candidateWord)}`);
            
            if (testResponse.ok) {
              randomWord = candidateWord;
              break; // Słowo jest OK, wychodzimy z pętli
            } else {
              attempts++;
              continue;
            }
          } else {
            attempts++;
            continue;
          }
        } else {
          throw new Error('API nie odpowiada');
        }
      } catch (error) {
        attempts++;
      }
    }
    
    // Jeśli wszystkie próby zawiodły, użyj fallback
    if (!randomWord || attempts >= maxAttempts) {
      randomWord = this.getFallbackRandomWord();
    }
    
    await this.searchWord(randomWord);
    
    // Przełącz na tab wyszukiwania
    const searchTab = this.querySelector('[data-tab="search"]') as HTMLButtonElement;
    searchTab?.click();
  }

  private getFallbackRandomWord(): string {
    const commonWords = [
      'serendipity', 'eloquent', 'mellifluous', 'ephemeral', 'petrichor',
      'wanderlust', 'solitude', 'paradigm', 'resilience', 'nostalgia',
      'authentic', 'innovative', 'magnificent', 'extraordinary', 'fascinating',
      'adventure', 'beautiful', 'creative', 'delightful', 'elegant',
      'freedom', 'graceful', 'harmony', 'inspiring', 'journey',
      'knowledge', 'luminous', 'mysterious', 'optimistic', 'peaceful',
      'brilliant', 'compassion', 'dedication', 'empathy', 'flourish',
      'gratitude', 'happiness', 'imagination', 'jubilant', 'kindness'
    ];
    return commonWords[Math.floor(Math.random() * commonWords.length)];
  }

  async getWordOfDay() {
    let wordOfDay: string;
    
    try {
      // Próbujemy użyć Wordnik API dla "word of the day" (bez klucza API)
      // Alternatywnie można użyć lokalnego generatora opartego na dacie
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      
      // Używamy większej, lepszej listy słów dla "słowa dnia"
      const wordsOfDay = [
        'magnificent', 'serendipity', 'eloquent', 'resilience', 'wanderlust',
        'paradigm', 'authentic', 'innovation', 'extraordinary', 'fascinating',
        'mellifluous', 'ephemeral', 'nostalgia', 'solitude', 'petrichor',
        'luminous', 'brilliant', 'harmony', 'adventure', 'beautiful',
        'creative', 'delightful', 'elegant', 'freedom', 'graceful',
        'inspiring', 'journey', 'knowledge', 'mysterious', 'optimistic',
        'peaceful', 'radiant', 'serene', 'tranquil', 'uplifting',
        'vivacious', 'wonderful', 'zealous', 'ambitious', 'benevolent',
        'compassion', 'dedication', 'empathy', 'flourish', 'gratitude',
        'happiness', 'imagination', 'jubilant', 'kindness', 'laughter',
        'mindful', 'nurture', 'opportunity', 'passion', 'quintessential',
        'remarkable', 'spectacular', 'triumphant', 'unique', 'victory',
        'wisdom', 'exquisite', 'youthful', 'zestful', 'abundant',
        'celestial', 'divine', 'eternal', 'fantastic', 'glorious',
        'heavenly', 'incredible', 'joyful', 'kaleidoscope', 'legendary'
      ];
      
      // Generujemy słowo na podstawie daty (zawsze to samo słowo dla danego dnia)
      const wordIndex = dayOfYear % wordsOfDay.length;
      wordOfDay = wordsOfDay[wordIndex];
      
    } catch (error) {
      // Fallback w przypadku błędu
      wordOfDay = this.getFallbackRandomWord();
    }
    
    await this.searchWord(wordOfDay);
    
    // Przełącz na tab wyszukiwania
    const searchTab = this.querySelector('[data-tab="search"]') as HTMLButtonElement;
    searchTab?.click();
  }

  startQuiz() {
    const favorites = this.getFavoriteWords();
    if (favorites.length < 3) {
      alert('Dodaj przynajmniej 3 słowa do ulubionych aby rozpocząć quiz!');
      return;
    }

    const quizWords = favorites.slice(0, Math.min(10, favorites.length));
    let currentQuestion = 0;
    let score = 0;

    const createQuizModal = () => {
      const modal = document.createElement('div');
      modal.className = 'quiz-modal';
      modal.innerHTML = `
        <div class="quiz-content">
          <div class="quiz-header">
            <h3>Quiz definicji</h3>
            <div class="quiz-progress">
              <span id="quiz-score">Wynik: ${score}/${quizWords.length}</span>
              <span id="quiz-counter">Pytanie: ${currentQuestion + 1}/${quizWords.length}</span>
            </div>
          </div>
          <div id="quiz-question"></div>
          <div id="quiz-options"></div>
          <div class="quiz-controls">
            <button id="quiz-close">Zamknij</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      return modal;
    };

    const showQuestion = async (modal: HTMLElement) => {
      if (currentQuestion >= quizWords.length) {
        showResults(modal);
        return;
      }

      const word = quizWords[currentQuestion];
      const questionDiv = modal.querySelector('#quiz-question');
      const optionsDiv = modal.querySelector('#quiz-options');
      
      if (!questionDiv || !optionsDiv) return;

      questionDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Ładowanie pytania...</p></div>';
      optionsDiv.innerHTML = '';

      try {
        // Pobierz definicję słowa
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        const data = await response.json();
        
        const correctDefinition = data[0]?.meanings[0]?.definitions[0]?.definition || 'Brak definicji';
        
        // Pobierz definicje innych słów jako niepoprawne opcje
        const wrongDefinitions = [];
        const otherWords = quizWords.filter(w => w !== word).slice(0, 3);
        
        for (const otherWord of otherWords) {
          try {
            const otherResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(otherWord)}`);
            const otherData = await otherResponse.json();
            const otherDefinition = otherData[0]?.meanings[0]?.definitions[0]?.definition;
            if (otherDefinition && otherDefinition !== correctDefinition) {
              wrongDefinitions.push(otherDefinition);
            }
          } catch {
            // Jeśli nie można pobrać definicji, dodaj ogólną
          }
        }

        // Jeśli nie mamy wystarczająco niepoprawnych definicji, dodaj ogólne angielskie
        while (wrongDefinitions.length < 3) {
          const genericDefinitions = [
            'A tool used for writing or drawing',
            'A place where people live together',
            'An action performed regularly',
            'A feeling or emotion experienced',
            'An object found in nature',
            'A concept related to time',
            'Something used for communication',
            'A physical structure or building'
          ];
          
          const randomDef = genericDefinitions[Math.floor(Math.random() * genericDefinitions.length)];
          if (!wrongDefinitions.includes(randomDef) && randomDef !== correctDefinition) {
            wrongDefinitions.push(randomDef);
          }
        }

        const options = [
          { text: correctDefinition, correct: true },
          ...wrongDefinitions.slice(0, 3).map(def => ({ text: def, correct: false }))
        ];

        // Przemieszaj opcje
        options.sort(() => Math.random() - 0.5);

        questionDiv.innerHTML = `
          <div class="quiz-word">
            <h4>Co oznacza słowo: <strong>"${word}"</strong>?</h4>
            <p class="quiz-instruction">Wybierz poprawną definicję po angielsku:</p>
          </div>
        `;

        optionsDiv.innerHTML = options.map((option, index) => `
          <button class="quiz-option" data-correct="${option.correct}">
            ${String.fromCharCode(65 + index)}. ${option.text}
          </button>
        `).join('');

        // Dodaj event listenery dla opcji
        optionsDiv.querySelectorAll('.quiz-option').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            const isCorrect = target.dataset.correct === 'true';
            
            // Pokaż odpowiedzi
            optionsDiv.querySelectorAll('.quiz-option').forEach(option => {
              const btn = option as HTMLButtonElement;
              btn.disabled = true;
              if (btn.dataset.correct === 'true') {
                btn.classList.add('correct');
              } else {
                btn.classList.add('wrong');
              }
            });

            if (isCorrect) {
              score++;
              target.classList.add('selected-correct');
            } else {
              target.classList.add('selected-wrong');
            }

            // Aktualizuj wynik
            const scoreElement = modal.querySelector('#quiz-score');
            if (scoreElement) {
              scoreElement.textContent = `Wynik: ${score}/${quizWords.length}`;
            }

            // Następne pytanie po 2 sekundach
            setTimeout(() => {
              currentQuestion++;
              const counterElement = modal.querySelector('#quiz-counter');
              if (counterElement) {
                counterElement.textContent = `Pytanie: ${currentQuestion + 1}/${quizWords.length}`;
              }
              showQuestion(modal);
            }, 2000);
          });
        });

      } catch (error) {
        questionDiv.innerHTML = `<p>Błąd ładowania pytania dla słowa "${word}". ${error instanceof Error ? error.message : ''}</p>`;
        setTimeout(() => {
          currentQuestion++;
          showQuestion(modal);
        }, 1000);
      }
    };

    const showResults = (modal: HTMLElement) => {
      const percentage = Math.round((score / quizWords.length) * 100);
      let message = '';
      
      if (percentage >= 80) message = '🏆 Doskonale! Jesteś mistrzem słownictwa!';
      else if (percentage >= 60) message = '👍 Dobrze! Twoja wiedza robi wrażenie!';
      else if (percentage >= 40) message = '📚 Nieźle! Warto poćwiczyć jeszcze trochę.';
      else message = '💪 Początek jest trudny, ale nie poddawaj się!';

      modal.querySelector('.quiz-content')!.innerHTML = `
        <div class="quiz-results">
          <h3>Wyniki quiz</h3>
          <div class="result-score">
            <div class="score-circle">
              <span class="score-percent">${percentage}%</span>
              <span class="score-fraction">${score}/${quizWords.length}</span>
            </div>
          </div>
          <p class="result-message">${message}</p>
          <div class="quiz-controls">
            <button id="quiz-again">🔄 Jeszcze raz</button>
            <button id="quiz-close">Zamknij</button>
          </div>
        </div>
      `;

      modal.querySelector('#quiz-again')?.addEventListener('click', () => {
        currentQuestion = 0;
        score = 0;
        modal.querySelector('.quiz-content')!.innerHTML = `
          <div class="quiz-header">
            <h3>Quiz definicji</h3>
            <div class="quiz-progress">
              <span id="quiz-score">Wynik: 0/${quizWords.length}</span>
              <span id="quiz-counter">Pytanie: 1/${quizWords.length}</span>
            </div>
          </div>
          <div id="quiz-question"></div>
          <div id="quiz-options"></div>
          <div class="quiz-controls">
            <button id="quiz-close">Zamknij</button>
          </div>
        `;
        
        modal.querySelector('#quiz-close')?.addEventListener('click', () => {
          document.body.removeChild(modal);
        });
        
        showQuestion(modal);
      });

      modal.querySelector('#quiz-close')?.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    };

    const modal = createQuizModal();
    
    modal.querySelector('#quiz-close')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    showQuestion(modal);
  }

  async startMemoryGame() {
    const favorites = this.getFavoriteWords();
    if (favorites.length < 4) {
      alert('Dodaj przynajmniej 4 słowa do ulubionych aby zagrać w memory!');
      return;
    }

    // Weź 6 słów (3 pary w grze 4x3)
    const gameWords = favorites.slice(0, 6);
    let flippedCards: HTMLElement[] = [];
    let matchedPairs = 0;
    let moves = 0;

    // Podstawowe tłumaczenia jako fallback
    const basicTranslations: {[key: string]: string} = {
      'hello': 'cześć',
      'world': 'świat', 
      'house': 'dom',
      'cat': 'kot',
      'dog': 'pies',
      'water': 'woda',
      'food': 'jedzenie',
      'book': 'książka',
      'school': 'szkoła',
      'friend': 'przyjaciel',
      'family': 'rodzina',
      'time': 'czas',
      'love': 'miłość',
      'life': 'życie',
      'work': 'praca',
      'money': 'pieniądze',
      'music': 'muzyka',
      'car': 'samochód',
      'tree': 'drzewo',
      'sun': 'słońce',
      'moon': 'księżyc',
      'beautiful': 'piękny',
      'good': 'dobry',
      'bad': 'zły',
      'big': 'duży',
      'small': 'mały',
      'new': 'nowy',
      'old': 'stary',
      'young': 'młody',
      'happy': 'szczęśliwy',
      'sad': 'smutny'
    };

    const modal = document.createElement('div');
    modal.className = 'memory-modal';
    modal.innerHTML = `
      <div class="memory-content">
        <div class="memory-header">
          <h3>🔤 Memory: Angielski ↔ Polski</h3>
          <div class="memory-stats">
            <span>Ruchy: <span id="moves-counter">0</span></span>
            <span>Pary: <span id="pairs-counter">0/${gameWords.length}</span></span>
          </div>
        </div>
        <div class="memory-board" id="memory-board"></div>
        <div class="memory-controls">
          <button id="memory-close">Zamknij</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Pobierz tłumaczenia dla słów
    const cardsWithTranslations = [];
    
    try {
      for (const word of gameWords) {
        let translation = basicTranslations[word.toLowerCase()] || `[${word}]`;
        
        // Spróbuj pobrać lepsze tłumaczenie z API
        try {
          const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|pl`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.responseStatus === 200) {
              const apiTranslation = data.responseData.translatedText;
              // Użyj API tłumaczenia jeśli nie jest takie samo jak oryginał
              if (apiTranslation.toLowerCase() !== word.toLowerCase()) {
                translation = apiTranslation;
              }
            }
          }
        } catch {
          // Zostań przy podstawowym tłumaczeniu
        }
        
        cardsWithTranslations.push({ type: 'english', content: word, id: word });
        cardsWithTranslations.push({ type: 'polish', content: translation, id: word });
      }
    } catch (error) {
      console.error('Error creating memory game:', error);
      // W przypadku błędu, użyj podstawowych tłumaczeń
      for (const word of gameWords) {
        const translation = basicTranslations[word.toLowerCase()] || `[${word}]`;
        cardsWithTranslations.push({ type: 'english', content: word, id: word });
        cardsWithTranslations.push({ type: 'polish', content: translation, id: word });
      }
    }

    // Przemieszaj karty
    cardsWithTranslations.sort(() => Math.random() - 0.5);

    const board = modal.querySelector('#memory-board');
    if (board) {
      board.innerHTML = cardsWithTranslations.map((card, index) => `
        <div class="memory-card" data-id="${card.id}" data-type="${card.type}" data-index="${index}">
          <div class="card-front"></div>
          <div class="card-back ${card.type}">
            <div class="card-flag">${card.type === 'english' ? '🇬🇧' : '🇵🇱'}</div>
            <div class="card-text">${card.content}</div>
          </div>
        </div>
      `).join('');

      // Event listenery dla kart
      board.querySelectorAll('.memory-card').forEach(card => {
        card.addEventListener('click', () => {
          if (flippedCards.length < 2 && !card.classList.contains('flipped')) {
            card.classList.add('flipped');
            flippedCards.push(card as HTMLElement);

            if (flippedCards.length === 2) {
              moves++;
              const movesCounter = modal.querySelector('#moves-counter');
              if (movesCounter) movesCounter.textContent = moves.toString();

              const [card1, card2] = flippedCards;
              
              if (card1.dataset.id === card2.dataset.id && card1.dataset.type !== card2.dataset.type) {
                // Dopasowanie angielski-polski!
                card1.classList.add('matched');
                card2.classList.add('matched');
                matchedPairs++;
                
                const pairsCounter = modal.querySelector('#pairs-counter');
                if (pairsCounter) pairsCounter.textContent = `${matchedPairs}/${gameWords.length}`;

                flippedCards = [];

                if (matchedPairs === gameWords.length) {
                  setTimeout(() => {
                    alert(`🎉 Brawo! Dopasowałeś wszystkie pary w ${moves} ruchach!`);
                  }, 500);
                }
              } else {
                // Brak dopasowania
                setTimeout(() => {
                  card1.classList.remove('flipped');
                  card2.classList.remove('flipped');
                  flippedCards = [];
                }, 1000);
              }
            }
          }
        });
      });
    }

    modal.querySelector('#memory-close')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }

  playPronunciation() {
    const pronunciationBtn = this.querySelector('.pronunciation-btn') as HTMLButtonElement;
    
    if (pronunciationBtn) {
      pronunciationBtn.classList.add('playing');
    }
    
    // Najpierw spróbuj odtworzyć audio z API
    const audio = this.querySelector('#word-audio') as HTMLAudioElement;
    
    if (audio && this.audioUrl) {
      audio.onended = () => {
        pronunciationBtn?.classList.remove('playing');
      };
      
      audio.play().catch(() => {
        // Jeśli audio z API nie działa, użyj syntezatora mowy
        this.useSpeechSynthesis(pronunciationBtn);
      });
    } else {
      // Jeśli nie ma audio z API, użyj syntezatora mowy
      this.useSpeechSynthesis(pronunciationBtn);
    }
  }

  useSpeechSynthesis(pronunciationBtn?: HTMLButtonElement) {
    if ('speechSynthesis' in window && this.currentWord) {
      // Zatrzymaj poprzednie odtwarzanie
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(this.currentWord);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        pronunciationBtn?.classList.remove('playing');
      };
      
      utterance.onerror = () => {
        pronunciationBtn?.classList.remove('playing');
        console.warn('Speech synthesis error');
      };
      
      // Znajdź angielski głos jeśli dostępny
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('US'))
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      speechSynthesis.speak(utterance);
    } else {
      pronunciationBtn?.classList.remove('playing');
      console.warn('Speech synthesis not supported or no word to pronounce');
    }
  }
}

customElements.define('dictionary-component', Dictionary);
