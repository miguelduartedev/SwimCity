import { goBackOrExplore } from '../utils/navigation';

describe('goBackOrExplore', () => {
  it('uses normal history when a previous route exists', () => {
    const router = { canGoBack: () => true, back: jest.fn(), replace: jest.fn() };
    goBackOrExplore(router);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces a direct detail route with Explore when history is unavailable', () => {
    const router = { canGoBack: () => false, back: jest.fn(), replace: jest.fn() };
    goBackOrExplore(router);
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
