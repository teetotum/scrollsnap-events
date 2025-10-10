# scrollsnap-events polyfill

This package is a polyfill for the experimental scrollsnap events [`scrollsnapchange`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchange_event) and [`scrollsnapchanging`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchanging_event).

You can try out an interactive [example](https://teetotum.github.io/scrollsnap-events/example.html) that includes the polyfill; visiting the example page with a _Chromium_ based browser will show the native behavior; visiting the example page with _Safari_ or _Firefox_ will show the polyfilled bahavior.

## usage

The package offers 4 entry points; most users will only need the first one.

- To automatically polyfill both events all you need to do is to import the main package `scrollsnap-events`

  ```js
  import "scrollsnap-events";
  ```

- To only polyfill `scrollsnapchange` import only the respective package subpath

  ```js
  import "scrollsnap-events/scrollsnapchange";
  ```

- To only polyfill `scrollsnapchanging` import only the respective package subpath

  ```js
  import "scrollsnap-events/scrollsnapchanging";
  ```

- To use the snap detection (without automatically polyfilling anything) you can import from `scrollsnap-events/core`
  ```js
  import {
    getSnapTargetVertical,
    getSnapTargetHorizontal,
  } from "scrollsnap-events/core";
  ```

## using snap detection without polyfilling anything

You can access the snap detection that is used by the polyfill under the hood.

```js
import {
  getSnapTargetVertical,
  getSnapTargetHorizontal,
} from "scrollsnap-events/core";
```

- `getSnapTargetVertical` must be called with the scroll container element as the argument.
  It returns the element that is deemed snapped, or `null` if no element is deemed snapped.
  ```js
  const scrollContainer = document.getElementById("vertical-scroller");
  const snapTarget = getSnapTargetVertical(scrollContainer);
  snapTarget?.classList.add("snapped");
  ```

- `getSnapTargetHorizontal` must be called with the scroll container element as the argument.
  It returns the element that is deemed snapped, or `null` if no element is deemed snapped.
  ```js
  const scrollContainer = document.getElementById("horizontal-scroller");
  const snapTarget = getSnapTargetHorizontal(scrollContainer);
  snapTarget?.classList.add("snapped");
  ```


## the snap detection mechanism and its limitations

The snap detection works by finding the element in a scroll snap container that is closest to its defined snap alignment position. The _snap alignment_ detecion mechanism was compared to alternative detection mechanisms and yielded the highest fidelity with regard to the native scroll snap event implementation in _Chromium_.

There can potentially be more than one element which are perfectly aligned with their respective snap alignment position. Therefore there is no guarantee that the polyfill will detect the actually snapped element under all circumstances; though the polyfill will yield an element that is plausibly a snapped element under the given circumstances.

The snap detection was tested in a range of test scenarios made up of various scroll containers and items with a variety of different values for scroll snap relevant properties like `scroll-padding`, `scroll-margin`, `scroll-snap-align`, `scroll-snap-type` etc.

You can try out the [test cases](https://teetotum.github.io/scrollsnap-events/testsuite.html) for yourself.

In one test scenario with a scroll container that allows scrolling and snapping in both axes the detected element and the actually snapped element diverged when the container was at the maximum scroll position. The detected element was the first fully visible element in the scroll container viewport, the actually snapped element was the second fully visible element. It is unclear whether the native behavior is intended and currently no effort has been made to emulate this idiosyncrasy.

## contributing and feedback

If you found a bug please report it in the [issues](https://github.com/teetotum/scrollsnap-events/issues) section of the github repository.
If you have questions or ideas for improvement please post in the [discussions](https://github.com/teetotum/scrollsnap-events/discussions) section.
Before submitting please do take the time to edit and proofread your post, and to use markdown formatting where applicable.
Please do not open any _pull request_ without prior discussion and an invitation for such a _pull request_.
