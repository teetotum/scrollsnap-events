import { go } from "./second.js";

const init = () => {
  const scroller = document.getElementById("scroller");

  const clearSnapped = () => {
    [...scroller.children].forEach((element) => {
      element.classList.remove("snapped");
    });
  };

  const clearWillSnap = () => {
    [...scroller.children].forEach((element) => {
      element.classList.remove("will-snap");
    });
  };

  scroller.addEventListener("scrollsnapchange", (e) => {
    clearSnapped();
    e.snapTargetInline?.classList.add("snapped");
    window.setTimeout(() => {
      clearWillSnap();
    }, 1000);
  });
  scroller.addEventListener("scrollsnapchanging", (e) => {
    clearWillSnap();
    e.snapTargetInline?.classList.add("will-snap");
  });

  const select = document.getElementById("select");
  select.addEventListener("change", (e) => {
    document.body.style.setProperty("--scroll-snap-align", e.target.value);
  });
};

if (go) init();
