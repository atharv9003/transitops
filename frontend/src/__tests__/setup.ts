import '@testing-library/jest-dom';

// Polyfill ResizeObserver (used by Recharts in jsdom)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
