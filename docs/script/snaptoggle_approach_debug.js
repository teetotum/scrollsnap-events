// snap detection via cloning the scrollContainer and all descendants
// and one-by-one toggling for each item whether it is a snap-point or not
// by changing the value of scroll-snap-align.
// If there is more than one snap point, and snapping is mandatory, and the currently snapped element
// is toggled to scroll-snap-align: none; we would be able to observe that the scroll position in the container would change
// because now the container would scroll to the nearest remaining snap-point.
// If movement results from turning off snappabillity of en element we know that we have found the current snapTarget.

const DEBUG = false;

const prepareTestbed = (scrollContainer, outline) => {
  // we setup an invisible testbed in the DOM with the same size as the original scrollContainer
  const { width, height } = scrollContainer.getBoundingClientRect();
  const testbed = document.createElement("div");
  testbed.style.width = `${width}px`;
  testbed.style.height = `${height}px`;
  if (!DEBUG) {
    testbed.style.position = "fixed";
    testbed.style.pointerEvents = "none";
    testbed.style.visibility = "hidden";
  }
  if (outline && DEBUG) testbed.style.outline = outline;
  scrollContainer.insertAdjacentElement("afterend", testbed);

  return testbed;
};

export const getSnapTargetInline = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];
  const items = potentialSnapPoints;

  const axis = getComputedSnapAxis(scrollContainer);
  if (axis === "none" || axis === "block") return null;

  if (wouldJumpToNewSnappoint(scrollContainer, testbed)) {
    // no item was snapped, otherwise the container would have ignored any newly inserted snap-points
    return null;
  }

  let currentlySnappedItem = null;

  const cloned = scrollContainer.cloneNode(/* deep */ true);
  testbed.append(cloned);
  cloned.style.scrollBehavior = "auto";
  const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];
  cloned.scrollLeft = scrollContainer.scrollLeft;
  const originalScrollLeft = cloned.scrollLeft; // we take cloned.scrollLeft instead of scrollContainer.scrollLeft because they could potentially differ, and we are only iterested in real movement inside cloned

  for (let i = 0; i < items.length; i++) {
    const element = items[i];
    const clonedTwin = cloned_potentialSnapPoints[i];
    const origInlineStyle = clonedTwin.style.scrollSnapAlign;
    clonedTwin.style.scrollSnapAlign = "none";
    const resultingScrollLeft = cloned.scrollLeft;
    if (originalScrollLeft !== resultingScrollLeft) {
      currentlySnappedItem = element;
      break;
    } else {
      clonedTwin.style.scrollSnapAlign = origInlineStyle;
    }
  }
  cloned.remove();
  testbed.remove();

  return currentlySnappedItem;
};

export const getSnapTargetBlock = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];
  const items = potentialSnapPoints;

  const axis = getComputedSnapAxis(scrollContainer);
  if (axis === "none" || axis === "inline") return null;

  if (wouldJumpToNewSnappoint(scrollContainer, testbed)) {
    // no item was snapped, otherwise the container would have ignored any newly inserted snap-points
    return null;
  }

  let currentlySnappedItem = null;

  const cloned = scrollContainer.cloneNode(/* deep */ true);
  testbed.append(cloned);
  cloned.style.scrollBehavior = "auto";
  const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];
  cloned.scrollTop = scrollContainer.scrollTop;
  const originalScrollTop = cloned.scrollTop;

  for (let i = 0; i < items.length; i++) {
    const element = items[i];
    const clonedTwin = cloned_potentialSnapPoints[i];
    const origInlineStyle = clonedTwin.style.scrollSnapAlign;
    clonedTwin.style.scrollSnapAlign = "none";
    const resultingScrollTop = cloned.scrollTop;
    if (originalScrollTop !== resultingScrollTop) {
      currentlySnappedItem = element;
      break;
    } else {
      clonedTwin.style.scrollSnapAlign = origInlineStyle;
    }
  }
  cloned.remove();
  testbed.remove();

  return currentlySnappedItem;
};

const getComputedSnapAxis = (scrollContainer) => {
  // returns 'none', 'block', 'inline', 'both'

  const containerStyle = window.getComputedStyle(scrollContainer);
  const [scrollSnapTypeAxis] = containerStyle.scrollSnapType.split(" ");
  const writingMode = containerStyle.writingMode;
  switch (scrollSnapTypeAxis) {
    case "x":
      return writingMode === "horizontal-tb" ? "inline" : "block";
    case "inline":
      return "inline";
    case "block":
      return "block";
    case "both":
      return "both";
    case "y":
      return writingMode === "horizontal-tb" ? "block" : "inline";
    default:
      return "none";
  }
};

const doesNotSnapInInlineAxis = (scrollContainer, testbed) => {
  const cloned = scrollContainer.cloneNode(/* deep */ true);
  cloned.querySelectorAll("*").forEach((x) => {
    x.style.scrollSnapAlign = "none";
  });
  testbed.append(cloned);
  cloned.style.scrollBehavior = "auto";
  const originalScrollLeft = cloned.scrollLeft;
  const honeypot = document.createElement("div");
  honeypot.style.paddingLeft = "100px";
  const honeypot_inner = document.createElement("div");
  honeypot.append(honeypot_inner);
  honeypot_inner.style.scrollSnapAlign = "start";
  cloned.append(honeypot);
  const resultingScrollLeft = cloned.scrollLeft;
  const doesNotSnapInInlineAxis = originalScrollLeft === resultingScrollLeft;
  cloned.remove();
  return doesNotSnapInInlineAxis;
};

const doesNotSnapInBlockAxis = (scrollContainer, testbed) => {
  const cloned = scrollContainer.cloneNode(/* deep */ true);
  cloned.querySelectorAll("*").forEach((x) => {
    x.style.scrollSnapAlign = "none";
  });
  testbed.append(cloned);
  cloned.style.scrollBehavior = "auto";
  const originalScrollTop = cloned.scrollTop;
  const honeypot = document.createElement("div");
  honeypot.style.paddingTop = "100px";
  const honeypot_inner = document.createElement("div");
  honeypot.append(honeypot_inner);
  honeypot_inner.style.scrollSnapAlign = "start";
  cloned.append(honeypot);
  const resultingScrollTop = cloned.scrollTop;
  const doesNotSnapInBlockAxis = originalScrollTop === resultingScrollTop;
  cloned.remove();
  return doesNotSnapInBlockAxis;
};

const wouldJumpToNewSnappoint = (scrollContainer, testbed) => {
  const cloned = scrollContainer.cloneNode(/* deep */ true);
  testbed.append(cloned);
  cloned.style.scrollBehavior = "auto";
  cloned.scrollLeft = scrollContainer.scrollLeft;
  cloned.scrollTop = scrollContainer.scrollTop;

  // release scroll tension: a snap-target might be snapped but cannot be scrolled
  // into its final snap position by the current container
  // because maximum scrollLeft or scrollTop is reached.
  // we release scroll tension by increasing maximum scrollLeft / scrollTop
  // prior to perfoming the honeypot test (otherwise the honeypot test
  // would release the scrolll tension and thereby givin a false positive test result)
  const tensionRelieve = document.createElement("div");
  tensionRelieve.style.width = `${100}px`;
  tensionRelieve.style.height = `${100}px`;
  tensionRelieve.style.marginLeft = `${scrollContainer.scrollWidth}px`;
  tensionRelieve.style.marginTop = `${scrollContainer.scrollHeight}px`;
  cloned.append(tensionRelieve);

  // now take the measurements for later comparison
  const originalScrollLeft = cloned.scrollLeft;
  const originalScrollTop = cloned.scrollTop;

  // insert new snap-point (the honeypot)
  const honeypot = document.createElement("div");
  honeypot.style.scrollSnapAlign = "end end";
  honeypot.style.width = `${100}px`;
  honeypot.style.height = `${100}px`;
  honeypot.style.marginLeft = `${scrollContainer.scrollWidth}px`;
  honeypot.style.marginTop = `${scrollContainer.scrollHeight}px`;
  cloned.append(honeypot);

  // and check resulting scrollLeft/scrollTop
  const resultingScrollLeft = cloned.scrollLeft;
  const resultingScrollTop = cloned.scrollTop;
  cloned.remove();
  const scrollLeftChanged = resultingScrollLeft !== originalScrollLeft;
  const scrollTopChanged = resultingScrollTop !== originalScrollTop;

  return scrollLeftChanged || scrollTopChanged;
};

export const getSnapTargetInline_old = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];

  const items = potentialSnapPoints;

  const axis = getComputedSnapAxis(scrollContainer);
  if (axis === "none" || axis === "block") return null;

  if (wouldJumpToNewSnappoint(scrollContainer, testbed)) {
    // no item was snapped, otherwise the container would have ignored any newly inserted snap-points
    return null;
  }

  let currentlySnappedItem = null;
  for (const element of items) {
    const currentIndex = items.indexOf(element);

    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";
    const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];

    //
    //

    // consider case when both axis can be scrolled
    cloned.scrollTop = scrollContainer.scrollTop;
    cloned.scrollLeft = scrollContainer.scrollLeft;
    const originalScrollTop = cloned.scrollTop;
    const originalScrollLeft = cloned.scrollLeft;

    cloned_potentialSnapPoints.forEach((item, i) => {
      if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    });
    const resultingScrollTop = cloned.scrollTop;
    const resultingScrollLeft = cloned.scrollLeft;
    cloned.remove();

    if (originalScrollLeft === resultingScrollLeft) {
      currentlySnappedItem = element;
      break;
    }
  }

  if (!DEBUG) {
    testbed.remove();
  }

  return currentlySnappedItem;
};

export const getSnapTargetBlock_old = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];

  const items = potentialSnapPoints;

  const axis = getComputedSnapAxis(scrollContainer);
  if (axis === "none" || axis === "inline") return null;

  if (wouldJumpToNewSnappoint(scrollContainer, testbed)) {
    // no item was snapped, otherwise the container would have ignored any newly inserted snap-points
    return null;
  }

  let currentlySnappedItem = null;
  for (const element of items) {
    const currentIndex = items.indexOf(element);

    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";
    const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];

    //
    //

    // consider case when both axis can be scrolled
    cloned.scrollTop = scrollContainer.scrollTop;
    cloned.scrollLeft = scrollContainer.scrollLeft;
    const originalScrollTop = cloned.scrollTop;
    const originalScrollLeft = cloned.scrollLeft;

    cloned_potentialSnapPoints.forEach((item, i) => {
      if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    });
    const resultingScrollTop = cloned.scrollTop;
    const resultingScrollLeft = cloned.scrollLeft;
    cloned.remove();

    if (originalScrollTop === resultingScrollTop) {
      currentlySnappedItem = element;
      break;
    }
  }

  if (!DEBUG) {
    testbed.remove();
  }

  return currentlySnappedItem;
};

export const getSnapTargetInline_deep = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];

  let currentlySnappedItem = null;
  for (const element of potentialSnapPoints) {
    const currentIndex = potentialSnapPoints.indexOf(element);
    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";
    cloned.scrollLeft = scrollContainer.scrollLeft;
    const originalScrollLeft = cloned.scrollLeft;
    const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];
    cloned_potentialSnapPoints.forEach((item, i) => {
      if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    });
    const resultingScrollLeft = cloned.scrollLeft;
    cloned.remove();

    if (originalScrollLeft === resultingScrollLeft) {
      currentlySnappedItem = element;
      break;
    }
  }

  testbed.remove();

  return currentlySnappedItem;
};

export const getSnapTargetBlock_deep = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];

  let currentlySnappedItem = null;
  for (const element of potentialSnapPoints) {
    const currentIndex = potentialSnapPoints.indexOf(element);
    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";
    cloned.scrollTop = scrollContainer.scrollTop;
    const originalScrollTop = cloned.scrollTop;
    const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];
    cloned_potentialSnapPoints.forEach((item, i) => {
      if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    });
    const resultingScrollTop = cloned.scrollTop;
    cloned.remove();

    if (originalScrollTop === resultingScrollTop) {
      currentlySnappedItem = element;
      break;
    }
  }

  testbed.remove();

  return currentlySnappedItem;
};

export const getSnapTargetInline_inverted = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];

  const items = potentialSnapPoints;

  const axis = getComputedSnapAxis(scrollContainer);
  if (axis === "none" || axis === "block") return null;

  if (wouldJumpToNewSnappoint(scrollContainer, testbed)) {
    // no item was snapped, otherwise the container would have ignored any newly inserted snap-points
    return null;
  }

  let currentlySnappedItem = null;
  for (const element of items) {
    const currentIndex = items.indexOf(element);

    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";

    const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];

    // add an artificial item that acts as potential snap-point:
    // we do this to ensure that there is at least one eligible alternative snap target
    // if there currently is a snapped genuine item
    // and we test it by disabling its snappabillity
    // we need to be certain that the container does actually have another snap-target
    // to snap to, otherwiwse we could detect no scroll change if the snapped item was the single snap-point
    // insert new snap-point (the auxiliary)
    const auxiliary = document.createElement("div");
    auxiliary.style.scrollSnapAlign = "end end";
    auxiliary.style.width = `${100}px`;
    auxiliary.style.height = `${100}px`;
    auxiliary.style.flex = "none";
    auxiliary.style.marginLeft = `${scrollContainer.scrollWidth}px`;
    auxiliary.style.marginTop = `${scrollContainer.scrollHeight}px`;
    cloned.append(auxiliary);

    // now all preparations are done, take the measurements now

    // consider case when both axis can be scrolled
    cloned.scrollTop = scrollContainer.scrollTop;
    cloned.scrollLeft = scrollContainer.scrollLeft;
    const originalScrollTop = cloned.scrollTop;
    const originalScrollLeft = cloned.scrollLeft;

    // cloned_items.forEach((item, i) => {
    //   if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    // });
    cloned_potentialSnapPoints[currentIndex].style.scrollSnapAlign = "none";
    const resultingScrollTop = cloned.scrollTop;
    const resultingScrollLeft = cloned.scrollLeft;

    if (!DEBUG) {
      cloned.remove();
    }

    if (originalScrollLeft !== resultingScrollLeft) {
      currentlySnappedItem = element;

      // for debugging
      if (DEBUG) {
        cloned_potentialSnapPoints[currentIndex].style.scrollSnapAlign = "";
        cloned.scrollLeft = scrollContainer.scrollLeft;
      }

      if (scrollContainer.scrollLeft > originalScrollLeft) {
        console.log("there was scroll tension");
        console.log("find next snap target");
        //currentlySnappedItem = items[currentIndex + 1];
        currentlySnappedItem = getNextSnapPointInline(
          currentlySnappedItem,
          scrollContainer,
          items
        );
      }

      break;
    }

    if (DEBUG) {
      const lastIndex = cloned_potentialSnapPoints.length - 1;

      if (currentIndex === lastIndex) {
        // for debugging
        cloned_potentialSnapPoints[currentIndex].style.scrollSnapAlign = "";
        cloned.scrollLeft = scrollContainer.scrollLeft;

        break;
      }

      cloned.remove();
    }
  }

  if (!DEBUG) {
    testbed.remove();
  }

  return currentlySnappedItem;
};

const getNextSnapPointInline = (
  currentlySnappedItem,
  scrollContainer,
  items
) => {
  // const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

  const testbed = prepareTestbed(scrollContainer, "4px dashed red");

  // debugger;

  const howFarDoWeTest = scrollContainer.scrollWidth;

  let nextSnapPoint = null;
  let leftBoundary = scrollContainer.scrollLeft;
  let rightBoundary = howFarDoWeTest;
  let nextTestPos = howFarDoWeTest;
  let gap;
  do {
    const snapPoint = getSnapTargetInlineAt(
      nextTestPos,
      scrollContainer,
      testbed,
      items
    );
    if (snapPoint === currentlySnappedItem) {
      leftBoundary = nextTestPos;
    } else {
      rightBoundary = nextTestPos;
      nextSnapPoint = snapPoint;
    }
    gap = rightBoundary - leftBoundary;
    nextTestPos = leftBoundary + gap / 2;
  } while (gap > 10);

  return nextSnapPoint;
};

const getSnapTargetInlineAt = (tryPos, scrollContainer, testbed, items) => {
  let currentlySnappedItem = null;
  for (const element of items) {
    const currentIndex = items.indexOf(element);

    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";

    const cloned_items = [...cloned.querySelectorAll("*")];

    // add an artificial item that acts as potential snap-point:
    // we do this to ensure that there is at least one eligible alternative snap target
    // if there currently is a snapped genuine item
    // and we test it by disabling its snappabillity
    // we need to be certain that the container does actually have another snap-target
    // to snap to, otherwiwse we could detect no scroll change if the snapped item was the single snap-point
    // insert new snap-point (the auxiliary)
    const auxiliary = document.createElement("div");
    auxiliary.style.scrollSnapAlign = "end end";
    auxiliary.style.width = `${100}px`;
    auxiliary.style.height = `${100}px`;
    auxiliary.style.flex = "none";
    auxiliary.style.marginLeft = `${scrollContainer.scrollWidth}px`;
    auxiliary.style.marginTop = `${scrollContainer.scrollHeight}px`;
    cloned.append(auxiliary);

    // now all preparations are done, take the measurements now
    cloned.scrollLeft = tryPos;
    cloned.scrollTop = scrollContainer.scrollTop;
    const originalScrollLeft = cloned.scrollLeft;

    // break;

    // cloned_items.forEach((item, i) => {
    //   if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    // });
    cloned_items[currentIndex].style.scrollSnapAlign = "none";
    const resultingScrollLeft = cloned.scrollLeft;

    if (!DEBUG) {
      cloned.remove();
    }

    if (originalScrollLeft !== resultingScrollLeft) {
      currentlySnappedItem = element;

      break;
    }

    if (DEBUG) {
      cloned.remove();
    }
  }

  return currentlySnappedItem;
};

export const getSnapTargetBlock_inverted = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];

  const items = potentialSnapPoints;

  const axis = getComputedSnapAxis(scrollContainer);
  if (axis === "none" || axis === "inline") return null;

  if (wouldJumpToNewSnappoint(scrollContainer, testbed)) {
    // no item was snapped, otherwise the container would have ignored any newly inserted snap-points
    return null;
  }

  let currentlySnappedItem = null;
  for (const element of items) {
    const currentIndex = items.indexOf(element);

    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";
    const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];

    // add an artificial item that acts as potential snap-point:
    // we do this to ensure that there is at least one eligible alternative snap target
    // if there currently is a snapped genuine item
    // and we test it by disabling its snappabillity
    // we need to be certain that the container does actually have another snap-target
    // to snap to, otherwiwse we could detect no scroll change if the snapped item was the single snap-point
    // insert new snap-point (the auxiliary)
    const auxiliary = document.createElement("div");
    auxiliary.style.scrollSnapAlign = "end end";
    auxiliary.style.width = `${100}px`;
    auxiliary.style.height = `${100}px`;
    auxiliary.style.marginLeft = `${scrollContainer.scrollWidth}px`;
    auxiliary.style.marginTop = `${scrollContainer.scrollHeight}px`;
    cloned.append(auxiliary);

    // now all preparations are done, take the measurements now

    // consider case when both axis can be scrolled
    cloned.scrollTop = scrollContainer.scrollTop;
    cloned.scrollLeft = scrollContainer.scrollLeft;
    const originalScrollTop = cloned.scrollTop;
    const originalScrollLeft = cloned.scrollLeft;

    // cloned_items.forEach((item, i) => {
    //   if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    // });
    cloned_potentialSnapPoints[currentIndex].style.scrollSnapAlign = "none";
    const resultingScrollTop = cloned.scrollTop;
    const resultingScrollLeft = cloned.scrollLeft;
    cloned.remove();

    if (originalScrollTop !== resultingScrollTop) {
      currentlySnappedItem = element;
      break;
    }
  }

  if (!DEBUG) {
    testbed.remove();
  }

  return currentlySnappedItem;
};

export const getSnapTargetInline_nested = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];

  const axis = getComputedSnapAxis(scrollContainer);
  if (axis === "none" || axis === "block") return null;

  if (wouldJumpToNewSnappoint(scrollContainer, testbed)) {
    // no item was snapped, otherwise the container would have ignored any newly inserted snap-points
    return null;
  }

  let currentlySnappedItem = null;
  for (const element of potentialSnapPoints) {
    const currentIndex = potentialSnapPoints.indexOf(element);

    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";
    cloned.scrollLeft = scrollContainer.scrollLeft;
    const originalScrollLeft = cloned.scrollLeft;

    const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];

    cloned_potentialSnapPoints.forEach((item, i) => {
      if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    });
    const resultingScrollLeft = cloned.scrollLeft;
    cloned.remove();

    if (originalScrollLeft === resultingScrollLeft) {
      currentlySnappedItem = element;
      break;
    }
  }

  testbed.remove();

  return currentlySnappedItem;
};

export const getSnapTargetBlock_nested = (scrollContainer) => {
  const testbed = prepareTestbed(scrollContainer);
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];

  // if (doesNotSnapInBlockAxis(scrollContainer, testbed)) return null;
  const axis = getComputedSnapAxis(scrollContainer);
  if (axis === "none" || axis === "inline") return null;

  if (wouldJumpToNewSnappoint(scrollContainer, testbed)) {
    // no item was snapped, otherwise the container would have ignored any newly inserted snap-points
    return null;
  }

  let currentlySnappedItem = null;
  for (const element of potentialSnapPoints) {
    const currentIndex = potentialSnapPoints.indexOf(element);

    const cloned = scrollContainer.cloneNode(/* deep */ true);
    testbed.append(cloned);
    cloned.style.scrollBehavior = "auto";
    cloned.scrollTop = scrollContainer.scrollTop;
    const originalScrollTop = cloned.scrollTop;

    const cloned_potentialSnapPoints = [...cloned.querySelectorAll("*")];

    cloned_potentialSnapPoints.forEach((item, i) => {
      if (i !== currentIndex && item.style) item.style.scrollSnapAlign = "none";
    });
    const resultingScrollTop = cloned.scrollTop;
    cloned.remove();

    if (originalScrollTop === resultingScrollTop) {
      currentlySnappedItem = element;
      break;
    }
  }

  testbed.remove();

  return currentlySnappedItem;
};
