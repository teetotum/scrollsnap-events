import { getScrollDetails } from "./scrollDetails.js";
import {
  getSnapTargetHorizontal,
  getSnapTargetVertical,
} from "./snapAlignment.js";

export class LastState {
  #lastSnappedBlock = new WeakRef(null);
  #lastSnappedInline = new WeakRef(null);

  get lastSnappedBlock() {
    return this.#lastSnappedBlock.deref();
  }

  set lastSnappedBlock(value) {
    return (this.#lastSnappedBlock = new WeakRef(value));
  }

  get lastSnappedInline() {
    return this.#lastSnappedInline.deref();
  }

  set lastSnappedInline(value) {
    return (this.#lastSnappedInline = new WeakRef(value));
  }
}

export const doCheckAndDispatchEvent = (
  anyScrollEvent,
  dispatchEventType,
  lastState
) => {
  if (anyScrollEvent.target !== anyScrollEvent.currentTarget) return;

  const { scrollDifferenceX, scrollDifferenceY } =
    getScrollDetails(anyScrollEvent);
  const containerStyle = window.getComputedStyle(anyScrollEvent.target);

  let snappedBlock = lastState.lastSnappedBlock;
  let snappedInline = lastState.lastSnappedInline;

  if (scrollDifferenceX != 0) {
    const snappedHorizontal = getSnapTargetHorizontal(anyScrollEvent.target);
    if (containerStyle.writingMode === "horizontal-tb")
      snappedInline = snappedHorizontal;
    else snappedBlock = snappedHorizontal;
  }
  if (scrollDifferenceY != 0) {
    const snappedVertical = getSnapTargetVertical(anyScrollEvent.target);
    if (containerStyle.writingMode === "horizontal-tb")
      snappedBlock = snappedVertical;
    else snappedInline = snappedVertical;
  }

  if (
    snappedBlock !== lastState.lastSnappedBlock ||
    snappedInline !== lastState.lastSnappedInline
  ) {
    lastState.lastSnappedBlock = snappedBlock;
    lastState.lastSnappedInline = snappedInline;
    const e = new Event(dispatchEventType, { bubbles: false });
    e.snapTargetBlock = snappedBlock;
    e.snapTargetInline = snappedInline;
    anyScrollEvent.target.dispatchEvent(e);
  }
};
