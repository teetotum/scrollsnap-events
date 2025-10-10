// can return 'none', 'x', 'y', 'both'
const getPhysicalSnapAxis = (containerStyle) => {
  const [snapAxis] = containerStyle.scrollSnapType.split(" ");

  switch (snapAxis) {
    case "x":
      return "x";
    case "y":
      return "y";
    case "both":
      return "both";
    case "inline":
      return containerStyle.writingMode === "horizontal-tb" ? "x" : "y";
    case "block":
      return containerStyle.writingMode === "horizontal-tb" ? "y" : "x";
    default:
      return "none";
  }
};

const toNumber = (padding_or_margin_value) => {
  if (padding_or_margin_value === "auto") return 0;
  else return Number.parseFloat(padding_or_margin_value);
};

const isSnapPoint = ([domElement, style]) => style.scrollSnapAlign !== "none";

const withComputedStyle = (domElement) => [
  domElement,
  window.getComputedStyle(domElement),
];

const epsilon = 2;

const notContained = (
  container,
  item,
  descendantStyle,
  physicalAxis,
  scrollDetails
) => {
  let snapBox;

  // When physicalAxis === 'x' we take scrollMarginLeft and scrollMarginRight into account
  // but scrollMarginTop and scrollMarginBottom are ignored.
  // We ignore scrollMarginLeft when the container is at the left edge of its scroll area.
  // We ignore scrollMarginRight when the container is at the right edge of its scroll area.
  if (physicalAxis === "x")
    snapBox = {
      left:
        item.left -
        (scrollDetails.scrollLeft < epsilon
          ? 0
          : toNumber(descendantStyle.scrollMarginLeft)),
      right:
        item.right +
        (scrollDetails.scrollLeft > scrollDetails.maxScrollLeft - epsilon
          ? 0
          : toNumber(descendantStyle.scrollMarginRight)),
      top: item.top,
      bottom: item.bottom,
    };

  // When physicalAxis === 'y' we take scrollMarginTop and scrollMarginBottom into account
  // but scrollMarginLeft and scrollMarginRight are ignored.
  // We ignore scrollMarginTop when the container is at the top edge of its scroll area.
  // We ignore scrollMarginBottom when the container is at the bottom edge of its scroll area.
  if (physicalAxis === "y")
    snapBox = {
      left: item.left,
      right: item.right,
      top:
        item.top -
        (scrollDetails.scrollTop < epsilon
          ? 0
          : toNumber(descendantStyle.scrollMarginTop)),
      bottom:
        item.bottom +
        (scrollDetails.scrollTop > scrollDetails.maxScrollTop - epsilon
          ? 0
          : toNumber(descendantStyle.scrollMarginBottom)),
    };

  if (snapBox.left < container.left && snapBox.right < container.right)
    return true;
  if (snapBox.right > container.right && snapBox.left > container.left)
    return true;
  if (snapBox.top < container.top && snapBox.bottom < container.bottom)
    return true;
  if (snapBox.bottom > container.bottom && snapBox.top > container.top)
    return true;

  return false;
};

export const getSnapTargetVertical = (scrollContainer) =>
  getSnapTarget(scrollContainer, "y");

export const getSnapTargetHorizontal = (scrollContainer) =>
  getSnapTarget(scrollContainer, "x");

const getSnapTarget = (scrollContainer, physicalDetectionAxis) => {
  const potentialSnapPoints = [...scrollContainer.querySelectorAll("*")];
  const containerStyle = window.getComputedStyle(scrollContainer);
  const physicalSnapAxis = getPhysicalSnapAxis(containerStyle);
  if (
    potentialSnapPoints.length === 0 ||
    physicalSnapAxis === "none" ||
    (physicalDetectionAxis === "x" && physicalSnapAxis === "y") ||
    (physicalDetectionAxis === "y" && physicalSnapAxis === "x")
  )
    return null;

  let currentlySnapped = null;
  let minDistance = Infinity;
  const containerRect = scrollContainer.getBoundingClientRect();
  // we need the container rect properties minus border width
  // i.e. the position properties that correspond to
  // scrollContainer.clientWidth and scrollContainer.clientHeight
  const borderThickness = {
    left: Number.parseFloat(containerStyle.borderLeftWidth),
    right: Number.parseFloat(containerStyle.borderRightWidth),
    top: Number.parseFloat(containerStyle.borderTopWidth),
    bottom: Number.parseFloat(containerStyle.borderBottomWidth),
  };
  const containerInnerRect = {
    width: containerRect.width - borderThickness.left - borderThickness.right,
    height: containerRect.height - borderThickness.top - borderThickness.bottom,
    top: containerRect.top + borderThickness.top,
    bottom: containerRect.bottom - borderThickness.bottom,
    left: containerRect.left + borderThickness.left,
    right: containerRect.right - borderThickness.right,
  };
  const scrollDetails = {
    maxScrollLeft: scrollContainer.scrollWidth - scrollContainer.clientWidth,
    maxScrollTop: scrollContainer.scrollHeight - scrollContainer.clientHeight,
    scrollLeft: scrollContainer.scrollLeft,
    scrollTop: scrollContainer.scrollTop,
  };

  // find the descendant element that's closest to its snap position
  potentialSnapPoints
    .map(withComputedStyle)
    .filter(isSnapPoint)
    .forEach(([descendant, descendantStyle]) => {
      const descendantRect = descendant.getBoundingClientRect();

      if (
        notContained(
          containerInnerRect,
          descendantRect,
          descendantStyle,
          physicalDetectionAxis,
          scrollDetails
        )
      ) {
        return;
      }

      const distance = calculateSnapDistance(
        physicalDetectionAxis,
        containerStyle,
        containerInnerRect,
        descendantStyle,
        descendantRect,
        scrollDetails
      );

      if (distance < minDistance) {
        minDistance = distance;
        currentlySnapped = descendant;
      }
    });

  return currentlySnapped;
};

const calculateSnapDistance = (
  physicalAxis,
  containerStyle,
  containerRect,
  descendantStyle,
  descendantRect,
  scrollDetails
) => {
  if (physicalAxis === "x")
    return calculateSnapDistanceX(
      containerStyle,
      containerRect,
      descendantStyle,
      descendantRect,
      scrollDetails
    );
  else
    return calculateSnapDistanceY(
      containerStyle,
      containerRect,
      descendantStyle,
      descendantRect,
      scrollDetails
    );
};

const calculateSnapDistanceX = (
  containerStyle,
  containerRect,
  descendantStyle,
  descendantRect,
  scrollDetails
) => {
  if (descendantStyle.scrollSnapAlign === "start") {
    // We ignore scrollPaddingLeft when the container is at the left edge of its scroll area.
    // (because it will not take effect)
    // We ignore scrollMarginLeft when...
    // the container is at the left edge of its scroll area AND the scroll margin is positive
    // (because it will not take effect)
    // But we have to take it into account when scroll margin is negative.
    const scrollMargin = toNumber(descendantStyle.scrollMarginLeft);
    const containerSnapEdge =
      containerRect.left +
      (scrollDetails.scrollLeft < epsilon
        ? 0
        : toNumber(containerStyle.scrollPaddingLeft));
    const descendantSnapEdge =
      descendantRect.left -
      (scrollMargin < 0
        ? scrollMargin
        : scrollDetails.scrollLeft < epsilon
        ? 0
        : scrollMargin);
    return Math.abs(containerSnapEdge - descendantSnapEdge);
  }
  if (descendantStyle.scrollSnapAlign === "center") {
    const containerCenter = containerRect.left + containerRect.width / 2;
    const descendantCenter = descendantRect.left + descendantRect.width / 2;
    return Math.abs(containerCenter - descendantCenter);
  }
  if (descendantStyle.scrollSnapAlign === "end") {
    // see comment above about when to ignore scrollPadding and scrollMargin
    const scrollMargin = toNumber(descendantStyle.scrollMarginRight);
    const containerSnapEdge =
      containerRect.right -
      (scrollDetails.scrollLeft > scrollDetails.maxScrollLeft - epsilon
        ? 0
        : toNumber(containerStyle.scrollPaddingRight));
    const descendantSnapEdge =
      descendantRect.right +
      (scrollMargin < 0
        ? scrollMargin
        : scrollDetails.scrollLeft > scrollDetails.maxScrollLeft - epsilon
        ? 0
        : scrollMargin);
    return Math.abs(containerSnapEdge - descendantSnapEdge);
  }
  return Infinity;
};

const calculateSnapDistanceY = (
  containerStyle,
  containerRect,
  descendantStyle,
  descendantRect,
  scrollDetails
) => {
  if (descendantStyle.scrollSnapAlign === "start") {
    // see comment above about when to ignore scrollPadding and scrollMargin
    const scrollMargin = toNumber(descendantStyle.scrollMarginTop);
    const containerSnapEdge =
      containerRect.top +
      (scrollDetails.scrollTop < epsilon
        ? 0
        : toNumber(containerStyle.scrollPaddingTop));
    const descendantSnapEdge =
      descendantRect.top -
      (scrollMargin < 0
        ? scrollMargin
        : scrollDetails.scrollTop < epsilon
        ? 0
        : scrollMargin);
    return Math.abs(containerSnapEdge - descendantSnapEdge);
  }
  if (descendantStyle.scrollSnapAlign === "center") {
    const containerCenter = containerRect.top + containerRect.height / 2;
    const descendantCenter = descendantRect.top + descendantRect.height / 2;
    return Math.abs(containerCenter - descendantCenter);
  }
  if (descendantStyle.scrollSnapAlign === "end") {
    // see comment above about when to ignore scrollPadding and scrollMargin
    const scrollMargin = toNumber(descendantStyle.scrollMarginBottom);
    const containerSnapEdge =
      containerRect.bottom -
      (scrollDetails.scrollTop > scrollDetails.maxScrollTop - epsilon
        ? 0
        : toNumber(containerStyle.scrollPaddingBottom));
    const descendantSnapEdge =
      descendantRect.bottom +
      (scrollMargin < 0
        ? scrollMargin
        : scrollDetails.scrollTop > scrollDetails.maxScrollTop - epsilon
        ? 0
        : scrollMargin);
    return Math.abs(containerSnapEdge - descendantSnapEdge);
  }
  return Infinity;
};
