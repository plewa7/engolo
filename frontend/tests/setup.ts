import '@testing-library/jest-dom';

// Mock globalnej funkcji fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn(() => null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
    destroy: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  BarController: jest.fn(),
  LineElement: jest.fn(),
  LineController: jest.fn(),
  PointElement: jest.fn(),
  ArcElement: jest.fn(),
  DoughnutController: jest.fn(),
  PieController: jest.fn(),
  ScatterController: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}));

// Mock Custom Elements API
global.customElements = {
  define: jest.fn(),
  get: jest.fn(),
  upgrade: jest.fn(),
  whenDefined: jest.fn(() => Promise.resolve()),
} as any;

// Mock HTMLElement.attachShadow
HTMLElement.prototype.attachShadow = jest.fn(() => ({
  innerHTML: '',
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
})) as any;
