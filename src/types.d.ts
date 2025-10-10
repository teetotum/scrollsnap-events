declare module "scrollsnap-events" {}

declare module "scrollsnap-events/scrollsnapchange" {}

declare module "scrollsnap-events/scrollsnapchanging" {}

declare module "scrollsnap-events/core" {
  function getSnapTargetVertical(
    scrollContainer: HTMLElement
  ): HTMLElement | null;

  function getSnapTargetHorizontal(
    scrollContainer: HTMLElement
  ): HTMLElement | null;

  export { getSnapTargetVertical, getSnapTargetHorizontal };
}
