type BackNavigation = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: '/') => void;
};

/** Returns to history when possible, or to Explore for a direct/deep-linked route. */
export function goBackOrExplore(router: BackNavigation) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}
