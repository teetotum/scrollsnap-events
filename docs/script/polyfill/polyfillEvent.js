const event_emulator_map = new WeakMap();

export const polyfillEvent = (eventType, setupEmulator) => {
  patchEventSystem(eventType, setupEmulator, window);
  patchEventSystem(eventType, setupEmulator, document);
  patchEventSystem(eventType, setupEmulator, Element.prototype);
};

const patchEventSystem = (eventType, setupEmulator, patchTarget) => {
  const originalAddEventListener = patchTarget.addEventListener;
  const originalRemoveEventListener = patchTarget.removeEventListener;

  const interceptedAddEventListener = function (
    type,
    listener,
    options_or_useCapture
  ) {
    originalAddEventListener.apply(this, arguments);

    // todo for some future version:
    // - correctly handle option.once
    //   idea: register another listener ('twin') with the exact same options to notify us when the event fired
    //   - we can then decrement the subscriber counter
    //   - and trigger an abort signal on the twin listener
    // - correctly handle option.signal
    //   can we observe abortSignals? yes. we can decrement the subscriber counter when a listener is aborted.

    // we ensure event_emulator is setup for listeners for the polyfilled eventType
    if (type === eventType) {
      const event_emulator = event_emulator_map.get(this);

      if (event_emulator) {
        event_emulator.subscribers++;
      } else {
        const teardown = setupEmulator.apply(this, [originalAddEventListener]);
        event_emulator_map.set(this, {
          subscribers: 1,
          teardown,
        });
      }
    }
  };

  const interceptedRemoveEventListener = function (
    type,
    listener,
    options_or_useCapture
  ) {
    originalRemoveEventListener.apply(this, arguments);

    if (type === eventType) {
      const event_emulator = event_emulator_map.get(this);

      if (event_emulator) {
        event_emulator.subscribers--;

        if (event_emulator.subscribers <= 0) {
          event_emulator.teardown();
          event_emulator_map.delete(this);
        }
      }
    }
  };

  patchTarget.addEventListener = interceptedAddEventListener;
  patchTarget.removeEventListener = interceptedRemoveEventListener;
};
