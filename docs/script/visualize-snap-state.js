import "./scrollend.js";
import { getScrollDetails } from "./scrollDetails.js";
import {
  getSnapTargetHorizontal as getHorizontalSnapTarget_via_snapAlignment,
  getSnapTargetVertical as getVerticalSnapTarget_via_snapAlignment,
} from "./snapAlignment.js";
import {
  getSnapTargetInline_inverted as getSnapTargets_Inline_Snaptoggle,
  getSnapTargetBlock_inverted as getSnapTargets_Block_Snaptoggle,
} from "./snaptoggle_approach_debug.js";
import {
  getSnapTargetInline_old as getSnapTargets_Inline_Snaptoggle_Old,
  getSnapTargetBlock_old as getSnapTargets_Block_Snaptoggle_Old,
} from "./snaptoggle_approach_debug.js";

const initSnapStateVisualization = () => {
  document.querySelectorAll(".testcase").forEach((testcase) => {
    console.log(`Initializing: ${testcase.querySelector("h2").textContent}`);

    const scrollContainer = testcase.querySelector(".scroll-container");
    const reports = testcase.querySelector(".reports");

    setupSnapDetection(
      scrollContainer,
      reports,
      "native snap state",
      "native-indicator",
      "reported-item-native"
    );

    setupSnapDetection(
      scrollContainer,
      reports,
      "snap-toggle approach",
      "snap-toggle-indicator",
      "reported-item-snap-toggle",
      {
        getVertical: getSnapTargets_Block_Snaptoggle,
        getHorizontal: getSnapTargets_Inline_Snaptoggle,
      }
    );

    setupSnapDetection(
      scrollContainer,
      reports,
      "snap-alignment approach",
      "snap-alignment-indicator",
      "reported-item-snap-alignment",
      {
        getVertical: getVerticalSnapTarget_via_snapAlignment,
        getHorizontal: getHorizontalSnapTarget_via_snapAlignment,
      }
    );

    // setupSnapDetection(
    //   scrollContainer,
    //   reports,
    //   "snap-toggle approach old",
    //   "old-indicator",
    //   "reported-item-old-snap-toggle",
    //   {
    //     getVertical: getSnapTargets_Block_Snaptoggle_Old,
    //     getHorizontal: getSnapTargets_Inline_Snaptoggle_Old,
    //   }
    // );
  });
};

const prepareAllSnapPoints = (scrollContainer, indicator_cssclass) => {
  const snapPoints = [...scrollContainer.querySelectorAll(".snap-point")];
  snapPoints.forEach((snapPoint) => {
    const indicator = document.createElement("div");
    indicator.classList.add(indicator_cssclass);
    snapPoint.childNodes.forEach((node) => indicator.appendChild(node));
    snapPoint.appendChild(indicator);
  });
};

const prepareReport = (
  reports,
  snapDetectionName,
  indicator_cssclass,
  snapped_cssclass
) => {
  const report = document.createElement("div");
  reports.append(report);
  report.classList.add("report");
  report.classList.add(snapped_cssclass);
  const border = document.createElement("div");
  border.classList.add(indicator_cssclass);
  report.append(border);
  const name = document.createElement("div");
  name.classList.add("algorithm-name");
  name.textContent = snapDetectionName;
  const result_block = document.createElement("div");
  result_block.classList.add("snap-target");
  const result_inline = document.createElement("div");
  result_inline.classList.add("snap-target");
  border.append(name);
  border.append(result_block);
  border.append(result_inline);
  result_block.textContent = "snap target block:";
  result_inline.textContent = "snap target inline:";
  const reported_block = document.createElement("span");
  const reported_inline = document.createElement("span");
  reported_block.classList.add("reported-block");
  reported_inline.classList.add("reported-inline");
  result_block.appendChild(reported_block);
  result_inline.appendChild(reported_inline);

  return report;
};

const highlightSnapTargets = (
  scrollContainer,
  report,
  snapped_cssclass,
  { snapTargetBlock, snapTargetInline }
) => {
  const reported_block = report.querySelector(".reported-block");
  const reported_inline = report.querySelector(".reported-inline");
  reported_block.textContent = snapTargetBlock?.innerText ?? "None";
  reported_inline.textContent = snapTargetInline?.innerText ?? "None";
  const snapPoints = [...scrollContainer.querySelectorAll(".snap-point")];
  snapPoints.forEach((snapPoint) => {
    snapPoint.classList.remove(snapped_cssclass);
  });
  snapTargetBlock?.classList.add(snapped_cssclass);
  snapTargetInline?.classList.add(snapped_cssclass);
};

const setupSnapDetection = (
  scrollContainer,
  reports,
  snapDetectionName,
  indicator_cssclass,
  snapped_cssclass,
  getters
) => {
  prepareAllSnapPoints(scrollContainer, indicator_cssclass);

  const report = prepareReport(
    reports,
    snapDetectionName,
    indicator_cssclass,
    snapped_cssclass
  );

  if (getters) {
    let lastSnappedVertical = null;
    let lastSnappedHorizontal = null;
    scrollContainer.addEventListener("scrollend", (e) => {
      const { scrollDifferenceX, scrollDifferenceY } = getScrollDetails(e);

      if (scrollDifferenceX != 0) {
        lastSnappedHorizontal = getters.getHorizontal(scrollContainer);
      }
      if (scrollDifferenceY != 0) {
        lastSnappedVertical = getters.getVertical(scrollContainer);
      }
      const containerStyle = window.getComputedStyle(scrollContainer);
      highlightSnapTargets(scrollContainer, report, snapped_cssclass, {
        snapTargetBlock:
          containerStyle.writingMode === "horizontal-tb"
            ? lastSnappedVertical
            : lastSnappedHorizontal,
        snapTargetInline:
          containerStyle.writingMode === "horizontal-tb"
            ? lastSnappedHorizontal
            : lastSnappedVertical,
      });
    });
  } else
    scrollContainer.addEventListener("scrollsnapchange", (e) => {
      highlightSnapTargets(scrollContainer, report, snapped_cssclass, e);
    });
};

initSnapStateVisualization();
