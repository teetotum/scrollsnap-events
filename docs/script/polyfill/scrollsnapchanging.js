import { polyfillEvent } from "./polyfillEvent.js";
import {
  LastState,
  doCheckAndDispatchEvent,
} from "./scrollsnapEventEmulation.js";

const coolDownDuration = 250;

function setupEmulator(originalAddEventListener) {
  const lastState = new LastState();
  let lastExecution = 0;
  const onScroll = (scrollEvent) => {
    // const now = Date.now();
    // if (lastExecution + coolDownDuration > now) {
    //   console.log("scroll: need to cool down");
    //   return;
    // }

    // console.log("scroll: execute doCheckAndDispatchEvent");

    // lastExecution = now;
    console.log("scroll");
    doCheckAndDispatchEvent(scrollEvent, "scrollsnapchanging", lastState);
  };
  const abortController = new AbortController();
  console.log(this)
  originalAddEventListener.apply(this, [
    "scroll",
    onScroll,
    { signal: abortController.signal, passive: false },
  ]);
  const teardown = () => {
    console.log('teardown of scroll listener')
    abortController.abort();
  };
  return teardown;
}

let initialized = false;

const init = () => {
  if (initialized) return;

  if (!("onscrollsnapchanging" in window)) {
    polyfillEvent("scrollsnapchanging", setupEmulator);
  }

  initialized = true;
};

init();
