# 🎓 Engolo - Interaktywna Platforma Nauki Języków

Engolo to nowoczesna platforma edukacyjna do nauki języków, składająca się z backendu opartego na Strapi CMS oraz frontendu zbudowanego w TypeScript z wykorzystaniem Lit.

## 📋 Spis treści

- [Opis projektu](#opis-projektu)
- [Architektura](#architektura)
- [Funkcjonalności](#funkcjonalności)
- [Technologie](#technologie)
- [Instalacja i uruchomienie](#instalacja-i-uruchomienie)
- [Struktura projektu](#struktura-projektu)
- [API Endpoints](#api-endpoints)
- [Testowanie](#testowanie)
- [Rozwój](#rozwój)
- [Licencja](#licencja)

## 🎯 Opis projektu

Engolo to kompleksowa platforma edukacyjna umożliwiająca:
- Naukę języków poprzez interaktywne ćwiczenia
- Tworzenie i rozwiązywanie quizów przez nauczycieli i uczniów
- Śledzenie postępów w nauce
- Komunikację w czasie rzeczywistym przez system czatu
- Zarządzanie użytkownikami z różnymi rolami (Student, Nauczyciel)

## 🏗️ Architektura

Projekt składa się z dwóch głównych komponentów:

```
engolo/
├── backend/     # API backend (Strapi CMS)
├── frontend/    # Aplikacja kliencka (TypeScript + Lit)
└── README.md    # Dokumentacja projektu
```

### Backend (Strapi CMS)
- **Port**: 1337
- **Baza danych**: SQLite (development)
- **Autoryzacja**: JWT
- **API**: RESTful

### Frontend
- **Port**: 5173 (development)
- **Framework**: Vite + TypeScript
- **UI Library**: Lit (Web Components)
- **State Management**: Elf Store
- **HTTP Client**: RxJS + AJAX

## ✨ Funkcjonalności

### 🔐 System uwierzytelniania
- Rejestracja i logowanie użytkowników
- Role: Student, Nauczyciel, Admin
- Zarządzanie sesjami JWT
- Zabezpieczenia CORS

### 📚 Moduły edukacyjne
- **Ćwiczenia językowe**: Interaktywne zadania z różnymi typami pytań
- **System quizów**: Tworzenie i rozwiązywanie quizów przez nauczycieli
- **Śledzenie postępów**: Statystyki uczenia się dla studentów i nauczycieli
- **Ranking**: System konkurencji między uczniami

### 💬 Komunikacja
- Chat w czasie rzeczywistym
- Komunikacja w grupach
- Wsparcie dla par i grup studyjnych

### 📊 Analityka i statystyki
- Dashboard dla studentów z ich postępami
- Panel nauczyciela z przeglądem klasy
- Szczegółowe statystyki wykonania ćwiczeń
- Wykresy postępów (Chart.js)

### 📖 Słownik i tłumaczenia
- **Słownik angielsko-polski**: Wyszukiwanie definicji słów (Dictionary API)
- **Translator dwukierunkowy**: Automatyczne wykrywanie języka (MyMemory API)
- **Ulubione słowa**: Zarządzanie osobistą kolekcją słówek
- **Historia wyszukiwań**: Śledzenie poprzednich zapytań
- **Gry słownikowe**: Quiz słownictwa i gra memory
- **Eksport słówek**: Możliwość pobrania ulubionych słów

### 🔔 System powiadomień
- **Powiadomienia osiągnięć**: Quiz completed, module completed, ranking advance
- **Streak notifications**: Powiadomienia o seriach nauki
- **Motywacyjne przypomnienia**: Automatyczne co 5 minut
- **Panel powiadomień**: Zarządzanie wszystkimi notyfikacjami
- **Popup notifications**: Real-time wyskakujące powiadomienia
- **Osiągnięcia specjalne**: Daily/weekly goals, perfect streaks, milestones

### 🎨 Interfejs użytkownika
- Responsywny design
- Tryb ciemny/jasny
- Nowoczesny interfejs oparty na Web Components
- Wsparcie dla urządzeń mobilnych

## 🛠️ Technologie

### Backend
- **Strapi 5.12.3** - Headless CMS
- **Node.js** - Runtime
- **TypeScript** - Język programowania
- **SQLite** - Baza danych (development)
- **Better SQLite3** - Driver bazy danych

### Frontend
- **Vite** - Build tool
- **TypeScript** - Język programowania
- **Lit 3.3.1** - Web Components library
- **RxJS** - Reactive programming
- **Elf Store** - State management
- **Chart.js** - Wykresy
- **Jest** - Framework testowy

### APIs zewnętrzne
- **Dictionary API** - Definicje słów angielskich
- **MyMemory Translation API** - Tłumaczenia tekstów
- **Web Speech API** - Syntetyzator mowy (wymowa słów)

## 🚀 Instalacja i uruchomienie

### Wymagania
- Node.js (wersja 18.x lub wyższa)
- npm lub yarn

### 1. Klonowanie repozytorium
```bash
git clone <repository-url>
cd engolo
```

### 2. Instalacja zależności
```bash
# Instalacja zależności głównych
npm install

# Instalacja zależności backendu
cd backend
npm install

# Instalacja zależności frontendu
cd ../frontend
npm install
```

### 3. Konfiguracja środowiska

#### Backend
Utwórz plik `.env` w folderze `backend/`:
```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret
```

### 4. Uruchomienie aplikacji

#### Development
```bash
# Terminal 1 - Backend
cd backend
npm run develop

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

#### Production
```bash
# Backend
cd backend
npm run build
npm run start

# Frontend
cd frontend
npm run build
npm run preview
```

### 5. Dostęp do aplikacji
- **Frontend**: http://localhost:5173
- **Backend Admin Panel**: http://localhost:1337/admin
- **API**: http://localhost:1337/api

## 📁 Struktura projektu

### Backend (`/backend`)
```
backend/
├── config/              # Konfiguracja Strapi
│   ├── admin.ts
│   ├── api.ts
│   ├── database.ts
│   ├── middlewares.ts
│   └── server.ts
├── src/
│   ├── api/             # API endpoints
│   │   ├── chat/        # System czatu
│   │   ├── exercise-statistic/  # Statystyki ćwiczeń
│   │   ├── quiz-set/    # Zestawy quizów
│   │   ├── quiz-statistic/      # Statystyki quizów
│   │   └── user-progress/       # Postępy użytkowników
│   ├── extensions/      # Rozszerzenia Strapi
│   └── index.ts         # Główny plik aplikacji
└── types/               # Definicje typów TypeScript
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/      # Komponenty UI
│   │   ├── auth/        # Komponenty autoryzacji
│   │   ├── chat/        # Komponenty czatu
│   │   ├── dashboard/   # Panele dashboard
│   │   ├── notifications/ # System powiadomień
│   │   ├── quiz/        # Komponenty quizów
│   │   └── ui/          # Podstawowe komponenty UI (słownik, navbar)
│   ├── features/        # Logika biznesowa
│   │   ├── auth/        # Obsługa autoryzacji
│   │   └── notifications/       # System powiadomień
│   ├── styles/          # Style CSS
│   ├── app.ts          # Główna aplikacja
│   └── main.ts         # Entry point
├── tests/              # Testy
│   ├── unit/           # Testy jednostkowe
│   ├── integration/    # Testy integracyjne
│   └── e2e/           # Testy end-to-end
└── public/            # Pliki statyczne
```

## 🔌 API Endpoints

### Uwierzytelnianie
- `POST /api/auth/local` - Logowanie
- `POST /api/auth/local/register` - Rejestracja

### Ćwiczenia i statystyki
- `GET /api/exercise-statistics` - Statystyki ćwiczeń
- `POST /api/exercise-statistics` - Dodanie statystyki
- `GET /api/quiz-statistics` - Statystyki quizów
- `POST /api/quiz-statistics` - Dodanie statystyki quizu

### Quizy
- `GET /api/quiz-sets` - Lista zestawów quizów
- `POST /api/quiz-sets` - Tworzenie zestawu quizów
- `PUT /api/quiz-sets/:id` - Aktualizacja zestawu
- `DELETE /api/quiz-sets/:id` - Usunięcie zestawu

### Chat
- `GET /api/chat-messages` - Wiadomości czatu
- `POST /api/chat-messages` - Wysłanie wiadomości
- `GET /api/chat-messages/groups` - Grupy czatu
- `POST /api/chat-messages/groups` - Tworzenie grupy

### Postępy użytkowników
- `GET /api/user-progress` - Postępy użytkownika
- `POST /api/user-progress` - Aktualizacja postępów

### APIs zewnętrzne (Client-side)
- `GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}` - Słownik angielski
- `GET https://api.mymemory.translated.net/get?q={text}&langpair={lang}` - Tłumaczenia

## 🧪 Testowanie

Projekt zawiera kompleksowy system testów obejmujący wszystkie aspekty aplikacji.

### Struktura testów
```
tests/
├── __mocks__/              # Mocki dla zewnętrznych bibliotek
│   ├── chart.js.ts         # Mock dla Chart.js
│   └── global-mocks.ts     # Globalne mocki
├── unit/                   # Testy jednostkowe
│   └── teacher-statistics.test.ts
├── integration/            # Testy integracyjne
│   └── teacher-statistics-integration.test.ts
├── e2e/                    # Testy end-to-end
│   └── teacher-statistics-e2e.test.ts
├── setup.ts               # Konfiguracja globalna
└── README.md              # Dokumentacja testów
```

### Uruchomienie testów
```bash
cd frontend

# Wszystkie testy
npm test

# Testy jednostkowe
npm run test:unit

# Testy integracyjne  
npm run test:integration

# Testy end-to-end
npm run test:e2e

# Testy z pokryciem kodu
npm run test:coverage

# Testy w trybie watch
npm run test:watch
```

### Typy testów

#### 🔬 Testy jednostkowe (Unit Tests)
- **Cel**: Testowanie izolowanych części kodu (metod, funkcji)
- **Zakres**: Pojedyncze komponenty i funkcje
- **Framework**: Jest + JSDOM
- **Mocki**: Chart.js, zewnętrzne APIs

#### 🔗 Testy integracyjne (Integration Tests)
- **Cel**: Testowanie współpracy między komponentami i API
- **Zakres**: Integracja frontend-backend, przepływ danych
- **Testowane**: Autoryzacja, API calls, state management

#### 🌐 Testy end-to-end (E2E Tests)
- **Cel**: Testowanie pełnych scenariuszy użytkownika
- **Framework**: Jest + Puppeteer
- **Zakres**: Kompletne user journey, interakcje UI

### Pokryte funkcjonalności
- ✅ **TeacherStatistics**: Pełne pokrycie (unit, integration, e2e)
- ✅ **API Integration**: Obsługa błędów, autoryzacja
- ✅ **Component Lifecycle**: Renderowanie, event handling
- ✅ **User Interactions**: Kliki, nawigacja, filtry
- ✅ **Error Handling**: Network errors, validation

### Konfiguracja testów
- **Jest**: Framework testowy z TypeScript support
- **JSDOM**: Symulacja środowiska przeglądarki
- **Puppeteer**: Automatyzacja przeglądarki dla E2E
- **Coverage**: Raporty pokrycia kodu w formacie HTML/LCOV

## 👥 Role użytkowników

### Student
- Rozwiązywanie ćwiczeń językowych
- Uczestnictwo w quizach
- Przeglądanie własnych statystyk
- Korzystanie z czatu
- **Używanie słownika**: Wyszukiwanie słów, tłumaczenia, gry
- **Otrzymywanie powiadomień**: Osiągnięcia, streak, motywacja

### Nauczyciel (Teacher)
- Tworzenie zestawów quizów
- Przeglądanie statystyk uczniów
- Zarządzanie grupami
- Monitorowanie postępów klasy
- **Panel powiadomień**: Śledzenie aktywności uczniów

### Admin
- Pełny dostęp do panelu administracyjnego Strapi
- Zarządzanie użytkownikami i rolami
- Konfiguracja systemu

## 🔧 Rozwój

### Dodawanie nowych funkcjonalności

#### Backend (Strapi)
1. Utwórz nowy content type w `src/api/`
2. Zdefiniuj schema w `content-types/*/schema.json`
3. Dodaj kontrolery w `controllers/`
4. Skonfiguruj routes w `routes/`
5. Dodaj services w `services/`

#### Frontend
1. Utwórz komponenty w `src/components/`
2. Dodaj logikę biznesową w `src/features/`
3. Dodaj style w `src/styles/`
4. Napisz testy w `tests/`
5. **Dla zewnętrznych APIs**: Dodaj fallback dla offline mode

### Zewnętrzne serwisy
- **Dictionary API**: Darmowe API dla definicji słów
- **MyMemory Translation API**: Darmowe tłumaczenia z obsługą CORS
- **Web Speech API**: Natywne API przeglądarki do syntezy mowy

### Konwencje kodowania
- Używaj TypeScript dla type safety
- Stosuj ESLint i Prettier
- Pisz testy dla nowych funkcjonalności
- Dokumentuj API endpoints
- Używaj semantic commit messages

### Funkcjonalności zaawansowane

#### 📖 Słownik (Dictionary Component)
- **5 zakładek**: Search, Translate, Favorites, History, Games
- **APIs**: Dictionary API + MyMemory Translation API
- **Offline support**: Fallback data gdy API niedostępne
- **Local storage**: Ulubione słowa, historia wyszukiwań
- **Games**: Quiz słownictwa, memory game
- **Export**: Możliwość eksportu ulubionych słów

#### 🔔 System powiadomień (Notification System)
- **Typy**: quiz_completed, module_completed, ranking_advance, streak, achievement
- **Components**: NotificationManager, NotificationPanel, NotificationPopup
- **Features**: Auto-popup, persystencja, filtrowanie, mark as read
- **Motivational timer**: Automatyczne przypomnienia co 5 minut
- **Achievement system**: Special milestones, daily/weekly goals

#### 🎮 Interaktywne elementy
- **Quiz games**: Multiple choice, vocabulary matching
- **Memory game**: Word-translation pairs
- **Progress tracking**: Visual progress bars, streak counters
- **Real-time chat**: Group messaging, pair learning

### Debug i troubleshooting
- Backend logi: dostępne w konsoli Strapi
- Frontend debugging: DevTools + Console
- Database: SQLite browser lub Strapi admin panel
- API testing: Postman lub curl
- **Notification debugging**: Console logs for all notification events
- **Dictionary API fallback**: Local data when external APIs fail

## 📝 Licencja

Projekt jest dostępny na licencji MIT. Zobacz plik `LICENSE` dla szczegółów.

## 🤝 Wsparcie

W przypadku problemów lub pytań:
1. Sprawdź dokumentację Strapi: https://docs.strapi.io
2. Sprawdź dokumentację Lit: https://lit.dev
3. Przejrzyj istniejące issues w repozytorium
4. Utwórz nowe issue z opisem problemu

---

Wykonane przez zespół deweloperski Engolo 🚀
