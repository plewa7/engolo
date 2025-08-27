// Mock dla localStorage
export const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock dla fetch
export const fetchMock = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    status: 200,
    statusText: 'OK',
  })
);

// Mock dla Custom Elements API
export const customElementsMock = {
  define: jest.fn(),
  get: jest.fn(),
  upgrade: jest.fn(),
  whenDefined: jest.fn(() => Promise.resolve()),
};
