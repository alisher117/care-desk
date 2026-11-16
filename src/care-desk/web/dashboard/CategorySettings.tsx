"use client";

import { Archive } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fmt, type DashboardLabels } from "../../config/labels";
import { ApiError, adminApi } from "../api";
import { useLabels } from "../labels-context";
import type { CategoryDto } from "../types";
import { CATEGORY_NAME_MAX } from "../validation";
import { CARD, CARD_TITLE, FIELD, PRIMARY_BUTTON, TEXT_LINK } from "./styles";

function failureMessage(err: unknown, fallback: string, labels: DashboardLabels): string {
  if (err instanceof ApiError) {
    if (err.reason === "exists") return labels.categoriesErrExists;
    console.error("[care-desk] category request failed", err);
    return fmt(labels.errWithStatus, { message: fallback, status: err.status });
  }
  console.error("[care-desk] category request failed", err);
  return fallback;
}

export default function CategorySettings({ canManage }: { canManage: boolean }) {
  const { labels } = useLabels();
  const [categories, setCategories] = useState<CategoryDto[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCategories((await adminApi.categories()).filter((c) => !c.archivedAt));
      setListError(null);
    } catch (err) {
      setListError(failureMessage(err, labels.categoriesErrLoad, labels));
    }
  }, [labels]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(key: string, fn: () => Promise<unknown>): Promise<boolean> {
    if (busyKey) return false;
    setBusyKey(key);
    setActionError(null);
    try {
      await fn();
      await load();
      return true;
    } catch (err) {
      setActionError(failureMessage(err, labels.categoriesErrUpdate, labels));
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (await run("new", () => adminApi.createCategory(trimmed))) setName("");
  }

  async function archive(category: CategoryDto) {
    if (await run(category.id, () => adminApi.archiveCategory(category.id))) setConfirmArchive(null);
  }

  return (
    <div className={`${CARD} p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className={CARD_TITLE}>{labels.categoriesTitle}</p>
        {categories && (
          <span className="rounded-xl bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {categories.length}
          </span>
        )}
      </div>

      {listError && <p className="text-xs font-medium text-red-600">{listError}</p>}
      {!categories && !listError && (
        <p className="text-xs font-medium text-gray-400">{labels.commonLoading}</p>
      )}
      {categories && categories.length === 0 && (
        <p className="text-xs font-medium text-gray-400">
          {canManage ? labels.categoriesEmptyManage : labels.categoriesEmpty}
        </p>
      )}

      {categories && categories.length > 0 && (
        <ul className="flex flex-col gap-1">
          {categories.map((c) => {
            const confirming = confirmArchive === c.id;
            return (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-xl px-2 py-2 transition-colors duration-200 ease-out hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="truncate text-[11px] font-medium text-gray-400">
                    {c.requesterVisible ? labels.categoriesShownInWidget : labels.categoriesHiddenFromWidget}
                  </p>
                </div>
                {!canManage ? null : confirming ? (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => void archive(c)}
                      disabled={busyKey !== null}
                      className={`${PRIMARY_BUTTON} px-3 py-1.5 text-xs`}
                      style={{ backgroundColor: "#e92c2c" }}
                    >
                      {busyKey === c.id ? labels.categoriesArchiving : labels.categoriesArchive}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmArchive(null)}
                      disabled={busyKey !== null}
                      className={`${TEXT_LINK} cursor-pointer text-xs disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {labels.commonCancel}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={c.requesterVisible}
                      aria-label={fmt(labels.categoriesShowInWidgetAria, { name: c.name })}
                      title={c.requesterVisible ? labels.categoriesActionHide : labels.categoriesActionShow}
                      disabled={busyKey !== null}
                      onClick={() =>
                        void run(c.id, () =>
                          adminApi.updateCategory(c.id, { requesterVisible: !c.requesterVisible }),
                        )
                      }
                      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${c.requesterVisible ? "bg-brand" : "bg-gray-200"}`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-out ${c.requesterVisible ? "translate-x-4" : "translate-x-0"}`}
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={fmt(labels.categoriesArchiveAria, { name: c.name })}
                      title={labels.categoriesArchive}
                      onClick={() => setConfirmArchive(c.id)}
                      disabled={busyKey !== null}
                      className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors duration-200 ease-out hover:bg-gray-100 hover:text-[#e92c2c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Archive size={14} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canManage && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={CATEGORY_NAME_MAX}
            placeholder={labels.categoriesNewPlaceholder}
            aria-label={labels.categoriesNewAria}
            className={FIELD}
          />
          <button
            type="submit"
            disabled={busyKey !== null || name.trim().length < 2}
            className={`${PRIMARY_BUTTON} shrink-0 bg-brand px-3`}
          >
            {busyKey === "new" ? labels.categoriesAdding : labels.categoriesAdd}
          </button>
        </form>
      )}
      {actionError && <p className="mt-2 text-xs font-medium text-red-600">{actionError}</p>}
      <p className="mt-3 text-[11px] font-medium text-gray-400">
        {canManage ? labels.categoriesHintManage : labels.categoriesHintReadOnly}
      </p>
    </div>
  );
}
