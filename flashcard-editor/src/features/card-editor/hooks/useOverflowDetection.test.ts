import { renderHook } from '@testing-library/react';
import { useOverflowDetection } from './useOverflowDetection';

// Mock ResizeObserver
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

beforeAll(() => {
  // @ts-ignore
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  }));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useOverflowDetection', () => {
  it('should initialize with non-overflowing state', () => {
    const { result } = renderHook(() => useOverflowDetection());
    const [ref, isOverflowing] = result.current;

    expect(ref.current).toBe(null);
    expect(isOverflowing).toBe(false);
  });

  it('should setup resize observer when ref is set', () => {
    const { result } = renderHook(() => useOverflowDetection());
    const [ref] = result.current;

    // Simulate ref being set
    const mockElement = document.createElement('div');
    Object.defineProperty(ref, 'current', {
      value: mockElement,
      writable: true,
    });

    expect(mockObserve).toHaveBeenCalledWith(mockElement);
  });

  it('should cleanup resize observer on unmount', () => {
    const { unmount } = renderHook(() => useOverflowDetection());

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should detect overflow when content exceeds dimensions', () => {
    const { result } = renderHook(() => useOverflowDetection());
    const [ref] = result.current;

    // Create a mock element with overflow
    const mockElement = document.createElement('div');
    Object.defineProperties(mockElement, {
      scrollHeight: { value: 200 },
      clientHeight: { value: 100 },
      scrollWidth: { value: 100 },
      clientWidth: { value: 100 },
    });

    // Set the ref
    Object.defineProperty(ref, 'current', {
      value: mockElement,
      writable: true,
    });

    // Trigger resize observer callback
    const [[callback]] = (global.ResizeObserver as jest.Mock).mock.calls;
    callback([{ target: mockElement }]);

    expect(result.current[1]).toBe(true);
  });

  it('should detect horizontal overflow', () => {
    const { result } = renderHook(() => useOverflowDetection());
    const [ref] = result.current;

    // Create a mock element with horizontal overflow
    const mockElement = document.createElement('div');
    Object.defineProperties(mockElement, {
      scrollHeight: { value: 100 },
      clientHeight: { value: 100 },
      scrollWidth: { value: 200 },
      clientWidth: { value: 100 },
    });

    // Set the ref
    Object.defineProperty(ref, 'current', {
      value: mockElement,
      writable: true,
    });

    // Trigger resize observer callback
    const [[callback]] = (global.ResizeObserver as jest.Mock).mock.calls;
    callback([{ target: mockElement }]);

    expect(result.current[1]).toBe(true);
  });

  it('should update when dependencies change', () => {
    const dependency = 'initial';
    const { result, rerender } = renderHook(
      ({ dep }) => useOverflowDetection([dep]),
      { initialProps: { dep: dependency } }
    );

    // Initial setup
    const [ref] = result.current;
    const mockElement = document.createElement('div');
    Object.defineProperties(mockElement, {
      scrollHeight: { value: 200 },
      clientHeight: { value: 100 },
      scrollWidth: { value: 100 },
      clientWidth: { value: 100 },
    });
    Object.defineProperty(ref, 'current', {
      value: mockElement,
      writable: true,
    });

    // Trigger initial check
    const [[callback]] = (global.ResizeObserver as jest.Mock).mock.calls;
    callback([{ target: mockElement }]);

    // Rerender with new dependency
    rerender({ dep: 'updated' });

    expect(result.current[1]).toBe(true);
  });
});
