import { initPool, setNotifier } from "../core";
import { careDeskNotifier } from "./notifier-adapter";

const url = process.env.CARE_DESK_DATABASE_URL ?? process.env.DATABASE_URL;

const flags = globalThis as { __careDeskWarned?: boolean };

if (url) {
  initPool(url);
} else if (!flags.__careDeskWarned) {
  console.warn(
    "[care-desk] No database URL found. Set CARE_DESK_DATABASE_URL (or DATABASE_URL).",
  );
}

if (!flags.__careDeskWarned) {
  flags.__careDeskWarned = true;
  console.warn(
    "[care-desk] Running WITHOUT authentication: every visitor is an operator with admin rights. " +
      "Replace host/identity-adapter.ts before exposing this app.",
  );
}

setNotifier(careDeskNotifier);

export const CARE_DESK_DB_URL = url ?? "";
