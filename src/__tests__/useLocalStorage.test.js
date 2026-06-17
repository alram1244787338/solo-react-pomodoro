import { renderHook, act } from '@testing-library/react';
import useLocalStorage from '../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('uses initialValue when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { workDuration: 25 })
    );
    const [value] = result.current;
    expect(value).toEqual({ workDuration: 25 });
  });

  it('reads and deserializes existing value from localStorage', () => {
    window.localStorage.setItem(
      'test-key',
      JSON.stringify({ workDuration: 50, breakDuration: 10 })
    );
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { workDuration: 25 })
    );
    expect(result.current[0]).toEqual({ workDuration: 50, breakDuration: 10 });
  });

  it('persists new value to localStorage when setter called', () => {
    const { result } = renderHook(() =>
      useLocalStorage('tasks', [])
    );
    act(() => {
      result.current[1]([{ id: '1', name: 'hello' }]);
    });
    expect(JSON.parse(window.localStorage.getItem('tasks'))).toEqual([
      { id: '1', name: 'hello' },
    ]);
  });

  it('falls back to initialValue on JSON parse error', () => {
    window.localStorage.setItem('bad', '{not-json');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage('bad', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('falls back to initialValue on localStorage read error', () => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = jest.fn(() => {
      throw new Error('denied');
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage('x', 'default'));
    expect(result.current[0]).toBe('default');
    consoleSpy.mockRestore();
    Storage.prototype.getItem = originalGetItem;
  });

  it('handles primitive values (string, number, boolean)', () => {
    const { result: str } = renderHook(() => useLocalStorage('str', 'hi'));
    expect(str.current[0]).toBe('hi');

    const { result: num } = renderHook(() => useLocalStorage('num', 42));
    expect(num.current[0]).toBe(42);

    const { result: bool } = renderHook(() => useLocalStorage('bool', true));
    expect(bool.current[0]).toBe(true);
  });

  it('updates persisted value across hook re-renders', () => {
    const { result, rerender } = renderHook(
      ({ key }) => useLocalStorage(key, 'initial'),
      { initialProps: { key: 'a' } }
    );
    act(() => {
      result.current[1]('updated');
    });
    rerender({ key: 'a' });
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(window.localStorage.getItem('a'))).toBe('updated');
  });
});
