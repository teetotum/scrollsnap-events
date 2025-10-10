const scrollstate_map = new WeakMap();
const associatedEventArgs_map = new WeakMap();

export const getScrollDetails = (e) => {
  const associatedEventArgs = associatedEventArgs_map.get(e);
  if (associatedEventArgs) {
    return associatedEventArgs;
  }

  const scrollContainer = e.target;
  const scrollLeft = scrollContainer.scrollLeft;
  const scrollTop = scrollContainer.scrollTop;
  const lastState = scrollstate_map.get(scrollContainer);
  const scrollDifferenceX = scrollLeft - (lastState?.scrollLeft ?? 0);
  const scrollDifferenceY = scrollTop - (lastState?.scrollTop ?? 0);
  const new_associatedEventArgs = { scrollDifferenceX, scrollDifferenceY };
  const new_scrollstate = { scrollLeft, scrollTop };
  associatedEventArgs_map.set(e, new_associatedEventArgs);
  scrollstate_map.set(scrollContainer, new_scrollstate);
  return new_associatedEventArgs;
};
