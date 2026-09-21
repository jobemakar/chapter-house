export interface NavigationButton {
  readonly dataset: DOMStringMap;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

/** Keep aria-current absent from inactive controls; "false" is still present. */
export const setCurrentNavigation = (
  buttons: Iterable<NavigationButton>,
  currentAction: string | null,
): void => {
  for (const button of buttons) {
    if (button.dataset.action === currentAction)
      button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
};
