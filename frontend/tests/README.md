# Testy dla projektu Engolo Frontend

## Struktura testów

Projekt zawiera trzy typy testów:

### 1. Testy jednostkowe (Unit Tests)
- **Lokalizacja**: `tests/unit/`
- **Cel**: Testowanie izolowanych części kodu (metod, funkcji)
- **Przykład**: `teacher-statistics.test.ts`

### 2. Testy integracyjne (Integration Tests)
- **Lokalizacja**: `tests/integration/`
- **Cel**: Testowanie współpracy między komponentami i API
- **Przykład**: `teacher-statistics-integration.test.ts`

### 3. Testy end-to-end (E2E Tests)
- **Lokalizacja**: `tests/e2e/`
- **Cel**: Testowanie pełnych scenariuszy użytkownika w przeglądarce
- **Przykład**: `teacher-statistics-e2e.test.ts`

## Instalacja zależności

```bash
npm install
```

## Uruchamianie testów

### Wszystkie testy
```bash
npm test
```

### Tylko testy jednostkowe
```bash
npm run test:unit
```

### Tylko testy integracyjne
```bash
npm run test:integration
```

### Tylko testy E2E
```bash
npm run test:e2e
```

### Testy w trybie watch (automatyczne ponowne uruchomienie przy zmianach)
```bash
npm run test:watch
```

### Testy z raportem pokrycia kodu
```bash
npm run test:coverage
```

## Konfiguracja

### Jest Configuration
Konfiguracja znajduje się w `jest.config.js`:
- Użycie TypeScript
- JSDOM jako środowisko testowe
- Mocki dla Chart.js i innych zależności

### Setup pliki
- `tests/setup.ts` - Globalna konfiguracja testów
- `tests/__mocks__/` - Mocki dla zewnętrznych bibliotek

## Testowany komponent

### TeacherStatistics
Komponent do wyświetlania statystyk nauczyciela z funkcjonalnościami:
- Ładowanie danych z API
- Wyświetlanie statystyk studentów
- Zarządzanie widokami (przegląd, studenci, moduły)
- Obsługa błędów

### Pokryte scenariusze:

#### Testy jednostkowe:
- ✅ Inicjalizacja komponentu
- ✅ Przetwarzanie danych
- ✅ Obsługa błędów
- ✅ Lifecycle komponentu
- ✅ Renderowanie

#### Testy integracyjne:
- ✅ Integracja z API
- ✅ Przetwarzanie odpowiedzi API
- ✅ Obsługa błędów autoryzacji
- ✅ Interakcje użytkownika

#### Testy E2E:
- ✅ Renderowanie komponentu
- ✅ Stany ładowania
- ✅ Interakcje użytkownika
- ✅ Obsługa błędów sieci
- ✅ Nawigacja między widokami

## Struktura testów

```
tests/
├── __mocks__/              # Mocki dla zewnętrznych bibliotek
│   ├── chart.js.ts
│   └── global-mocks.ts
├── unit/                   # Testy jednostkowe
│   └── teacher-statistics.test.ts
├── integration/            # Testy integracyjne
│   └── teacher-statistics-integration.test.ts
├── e2e/                    # Testy end-to-end
│   └── teacher-statistics-e2e.test.ts
└── setup.ts               # Konfiguracja globalna
```

## Przykład uruchomienia

```bash
# Uruchom wszystkie testy
npm test

# Uruchom z detalami
npm test -- --verbose

# Uruchom konkretny plik testowy
npm test teacher-statistics.test.ts

# Uruchom testy w trybie watch
npm run test:watch
```

## Uwagi dla pracy inżynierskiej

Testy zostały stworzone jako przykład dobrej praktyki testowania webcomponentów w projekcie TypeScript/Jest. Pokrywają one:

1. **Testy jednostkowe** - weryfikują poprawność działania poszczególnych metod i funkcji
2. **Testy integracyjne** - sprawdzają współpracę komponentu z API i innymi częściami systemu
3. **Testy E2E** - symulują rzeczywiste zachowanie użytkownika w przeglądarce

Każdy typ testu służy innemu celowi i razem zapewniają kompleksowe pokrycie testami krytycznych funkcjonalności aplikacji.
