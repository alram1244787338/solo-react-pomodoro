import '@testing-library/jest-dom';

global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };

global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

class MockNotification {
  constructor(title, options) {
    this.title = title;
    this.options = options;
    this.onclick = null;
  }
  close() {}
}
MockNotification.permission = 'granted';
MockNotification.requestPermission = jest.fn().mockResolvedValue('granted');
if (typeof window !== 'undefined') {
  window.Notification = MockNotification;
  global.Notification = MockNotification;
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  createOscillator() {
    return {
      frequency: { value: 0 },
      type: '',
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }
  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };
  }
  get destination() {
    return null;
  }
}
if (typeof window !== 'undefined') {
  window.AudioContext = MockAudioContext;
  window.webkitAudioContext = MockAudioContext;
  global.AudioContext = MockAudioContext;
}

if (typeof window !== 'undefined') {
  window.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn().mockReturnValue([]),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 50 })),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    quadraticCurveTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    arc: jest.fn(),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    setLineDash: jest.fn(),
  }));
  window.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn((name) => {
      const map = {
        '--text-primary': '#0f172a',
        '--text-secondary': '#64748b',
        '--text-muted': '#94a3b8',
        '--border-color': '#e2e8f0',
        '--accent-primary': '#8b5cf6',
        '--accent-work': '#ef4444',
        '--accent-work-light': '#fecaca',
        '--bg-card': '#ffffff',
      };
      return map[name] || '';
    }),
    getPropertyCSSValue: jest.fn(),
  }));
}

