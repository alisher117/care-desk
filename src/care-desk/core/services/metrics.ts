import { getPool } from "../db/pool";

export interface MetricsPeriod {
  from: Date;
  to: Date;
}

export interface OperatorMetrics {
  operatorId: string;
  displayName: string | null;
  handled: number;
  avgFirstActionSec: number | null;
}

export interface Metrics {
  opened: number;
  resolved: number;
  closed: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  avgFirstActionSec: number | null;
  avgResolutionSec: number | null;
  byOperator: OperatorMetrics[];
}

function tally(rows: { key: string | null; count: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.key ?? "—"] = Number(r.count);
  return out;
}

const toNum = (v: string | null | undefined): number | null =>
  v === null || v === undefined ? null : Math.round(Number(v));

export const metricsService = {
  async compute(period: MetricsPeriod): Promise<Metrics> {
    const pool = getPool();
    const p = [period.from, period.to];

    const opened = await pool.query<{ count: string }>(
      `select count(*) from care_tickets where created_at >= $1 and created_at < $2`, p);
    const resolved = await pool.query<{ count: string }>(
      `select count(*) from care_tickets where resolved_at >= $1 and resolved_at < $2`, p);
    const closed = await pool.query<{ count: string }>(
      `select count(*) from care_tickets where closed_at >= $1 and closed_at < $2`, p);

    const byStatus = await pool.query<{ key: string | null; count: string }>(
      `select status as key, count(*) from care_tickets
       where created_at >= $1 and created_at < $2 group by status`, p);
    const byPriority = await pool.query<{ key: string | null; count: string }>(
      `select priority as key, count(*) from care_tickets
       where created_at >= $1 and created_at < $2 group by priority`, p);
    const byCategory = await pool.query<{ key: string | null; count: string }>(
      `select care_category as key, count(*) from care_tickets
       where created_at >= $1 and created_at < $2 group by care_category`, p);

    const speed = await pool.query<{ avg_fa: string | null; avg_res: string | null }>(
      `select
         avg(extract(epoch from (first_action_at - created_at))) as avg_fa,
         avg(extract(epoch from (resolved_at - created_at)))     as avg_res
       from care_tickets where created_at >= $1 and created_at < $2`, p);

    const byOperator = await pool.query<{
      operator_id: string; display_name: string | null; handled: string; avg_fa: string | null;
    }>(
      `select o.id as operator_id, o.display_name,
              count(t.id) as handled,
              avg(extract(epoch from (t.first_action_at - t.created_at))) as avg_fa
       from care_operators o
       join care_tickets t on t.assigned_operator_id = o.id
       where t.created_at >= $1 and t.created_at < $2
       group by o.id, o.display_name
       order by handled desc`, p);

    const s = speed.rows[0];
    return {
      opened: Number(opened.rows[0]?.count ?? 0),
      resolved: Number(resolved.rows[0]?.count ?? 0),
      closed: Number(closed.rows[0]?.count ?? 0),
      byStatus: tally(byStatus.rows),
      byPriority: tally(byPriority.rows),
      byCategory: tally(byCategory.rows),
      avgFirstActionSec: toNum(s?.avg_fa),
      avgResolutionSec: toNum(s?.avg_res),
      byOperator: byOperator.rows.map((r) => ({
        operatorId: r.operator_id,
        displayName: r.display_name,
        handled: Number(r.handled),
        avgFirstActionSec: toNum(r.avg_fa),
      })),
    };
  },
};
