import { getPool } from "../pool";
import type { Category } from "../../domain/types";

interface CategoryRow {
  id: string;
  name: string;
  requester_visible: boolean;
  sort_order: number;
  archived_at: Date | null;
  created_at: Date;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    requesterVisible: row.requester_visible,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

export interface CategoryPatch {
  requesterVisible?: boolean;
  archivedAt?: Date | null;
}

export const categoryRepo = {
  async listAll(): Promise<Category[]> {
    const { rows } = await getPool().query<CategoryRow>(
      `select * from care_categories
        order by (archived_at is not null), sort_order, name`,
    );
    return rows.map(toCategory);
  },

  async listRequesterVisible(): Promise<Category[]> {
    const { rows } = await getPool().query<CategoryRow>(
      `select * from care_categories
        where archived_at is null and requester_visible
        order by sort_order, name`,
    );
    return rows.map(toCategory);
  },

  async findById(id: string): Promise<Category | null> {
    const { rows } = await getPool().query<CategoryRow>(
      `select * from care_categories where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toCategory(row) : null;
  },

  async findByName(name: string): Promise<Category | null> {
    const { rows } = await getPool().query<CategoryRow>(
      `select * from care_categories where lower(name) = lower($1)`,
      [name],
    );
    const row = rows[0];
    return row ? toCategory(row) : null;
  },

  async create(name: string, requesterVisible: boolean): Promise<Category> {
    const { rows } = await getPool().query<CategoryRow>(
      `insert into care_categories (name, requester_visible, sort_order)
       values ($1, $2, (select coalesce(max(sort_order), 0) + 10 from care_categories))
       returning *`,
      [name, requesterVisible],
    );
    const row = rows[0];
    if (!row) throw new Error("Care Desk: insert into care_categories returned no row");
    return toCategory(row);
  },

  async update(id: string, patch: CategoryPatch): Promise<Category | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (patch.requesterVisible !== undefined) {
      values.push(patch.requesterVisible);
      sets.push(`requester_visible = $${values.length}`);
    }
    if (patch.archivedAt !== undefined) {
      values.push(patch.archivedAt);
      sets.push(`archived_at = $${values.length}`);
    }
    if (sets.length === 0) return categoryRepo.findById(id);
    values.push(id);
    const { rows } = await getPool().query<CategoryRow>(
      `update care_categories set ${sets.join(", ")} where id = $${values.length} returning *`,
      values,
    );
    const row = rows[0];
    return row ? toCategory(row) : null;
  },
};
