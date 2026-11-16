import type { Notifier } from "./contracts/notifier";

let notifier: Notifier | null = null;

export function setNotifier(n: Notifier): void {
  notifier = n;
}

export function getNotifier(): Notifier | null {
  return notifier;
}
