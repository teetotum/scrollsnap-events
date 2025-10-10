import { polyfillEvent } from "./polyfillEvent.js";
import {
  LastState,
  doCheckAndDispatchEvent,
} from "./scrollsnapEventEmulation.js";

function setupEmulator(originalAddEventListener) {
  const lastState = new LastState();
  const onScrollend = (scrollendEvent) =>
    doCheckAndDispatchEvent(scrollendEvent, "scrollsnapchange", lastState);
  const teardown = setupScrollHasFinishedObserver.apply(this, [
    originalAddEventListener,
    onScrollend,
  ]);
  return teardown;
}

function setupScrollHasFinishedObserver(originalAddEventListener, onScrollend) {
  const abortController = new AbortController();

  if ("onscrollend" in window) {
    originalAddEventListener.apply(this, [
      "scrollend",
      onScrollend,
      { capture: true, signal: abortController.signal },
    ]);
  } else {
    // 'local' version of scrollyfills/scrollend.js polyfill by Adam Argyle
    // see https://github.com/argyleink/scrollyfills/blob/main/src/scrollend.js
    const pointers = new Set();

    document.addEventListener(
      "touchstart",
      (e) => {
        for (let touch of e.changedTouches) pointers.add(touch.identifier);
      },
      { passive: true, signal: abortController.signal }
    );

    document.addEventListener(
      "touchend",
      (e) => {
        for (let touch of e.changedTouches) pointers.delete(touch.identifier);
      },
      { passive: true, signal: abortController.signal }
    );

    document.addEventListener(
      "touchcancel",
      (e) => {
        for (let touch of e.changedTouches) pointers.delete(touch.identifier);
      },
      { passive: true, signal: abortController.signal }
    );

    let timeoutID = -1;
    const scrollListener = (e) => {
      const originalTarget = e.target;
      const listenerTarget = e.currentTarget;
      clearTimeout(timeoutID);
      const fireIfAllPointersCleared = () => {
        if (pointers.size) {
          // if pointer(s) are down, wait longer
          timeoutID = setTimeout(fireIfAllPointersCleared, 100);
        } else {
          // dispatch, but only to a single listener
          const args = {
            target: originalTarget,
            currentTarget: listenerTarget,
          };
          onScrollend(args);
          timeoutID = -1;
        }
      };
      timeoutID = setTimeout(fireIfAllPointersCleared, 100);
    };
    originalAddEventListener.apply(this, [
      "scroll",
      scrollListener,
      { passive: true, capture: true, signal: abortController.signal },
    ]);
  }

  return () => {
    abortController.abort();
  };
}

let initialized = false;

const init = () => {
  if (initialized) return;

  if (!("onscrollsnapchange" in window)) {
    polyfillEvent("scrollsnapchange", setupEmulator);
  }

  initialized = true;
};

init();
