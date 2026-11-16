export const CARE_DESK_OPEN_EVENT = "care-desk:open";

export function openCareDeskWidget(): void {
  window.dispatchEvent(new Event(CARE_DESK_OPEN_EVENT));
}
