import { getPool } from "../pool";
import type { Operator, OperatorStatus } from "../../domain/types";

interface OperatorRow {
  id: string;
  host_user_id: string;
  display_name: string | null;
  status: string;
  created_at: Date;
}

function toOperator(row: OperatorRow): Operator {
  return {
    id: row.id,
    hostUserId: row.host_user_id,
    displayName: row.display_name,
    status: row.status as OperatorStatus,
    createdAt: row.created_at,
  };
}

export const operatorRepo = {
  async ensure(hostUserId: string, displayName?: string | null): Promise<Operator> {
    const { rows } = await getPool().query<OperatorRow>(
      `insert into care_operators (host_user_id, display_name)
       values ($1, $2)
       on conflict (host_user_id)
       do update set display_name = coalesce(excluded.display_name, care_operators.display_name)
       returning *`,
      [hostUserId, displayName ?? null],
    );
    const row = rows[0];
    if (!row) throw new Error("Care Desk: upsert into care_operators returned no row");
    return toOperator(row);
  },

  async findById(id: string): Promise<Operator | null> {
    const { rows } = await getPool().query<OperatorRow>(
      `select * from care_operators where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toOperator(row) : null;
  },

  async listAll(): Promise<Operator[]> {
    const { rows } = await getPool().query<OperatorRow>(
      `select * from care_operators order by display_name nulls last, created_at`,
    );
    return rows.map(toOperator);
  },

  async setStatus(id: string, status: OperatorStatus): Promise<Operator | null> {
    const { rows } = await getPool().query<OperatorRow>(
      `update care_operators set status = $1 where id = $2 returning *`,
      [status, id],
    );
    const row = rows[0];
    return row ? toOperator(row) : null;
  },
};
