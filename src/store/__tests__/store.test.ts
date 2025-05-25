import { describe, it, expect } from 'vitest';
import { store } from '../index';
import { setLoading, setError } from '../index';

describe('Redux Store', () => {
  it('should have initial state', () => {
    const state = store.getState();
    expect(state.app).toEqual({
      isLoading: false,
      error: null,
    });
  });

  it('should handle setLoading action', () => {
    store.dispatch(setLoading(true));
    expect(store.getState().app.isLoading).toBe(true);

    store.dispatch(setLoading(false));
    expect(store.getState().app.isLoading).toBe(false);
  });

  it('should handle setError action', () => {
    const errorMessage = 'Test error message';
    store.dispatch(setError(errorMessage));
    expect(store.getState().app.error).toBe(errorMessage);

    store.dispatch(setError(null));
    expect(store.getState().app.error).toBe(null);
  });
}); 