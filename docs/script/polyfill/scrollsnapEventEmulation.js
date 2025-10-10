import { getScrollDetails } from "./scrollDetails.js";
import {
  getSnapTargetHorizontal,
  getSnapTargetVertical,
} from "./snapAlignment.js";

export class LastState {
  #lastSnappedBlock = null;
  #lastSnappedInline = null;

  get lastSnappedBlock() {
    return this.#lastSnappedBlock?.deref() ?? null;
  }

  set lastSnappedBlock(value) {
     this.#lastSnappedBlock = value ? new WeakRef(value) : null;
  }

  get lastSnappedInline() {
    return this.#lastSnappedInline?.deref() ?? null;
  }

  set lastSnappedInline(value) {
    this.#lastSnappedInline = value ? new WeakRef(value) : null;
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
