import type pg from "pg";

/** Matches pgmq `message_record` shape returned by `pgmq_public.read`. */
export type PgmqMessage = {
  msg_id: string;
  read_ct: string;
  enqueued_at: Date;
  vt: Date;
  message: Record<string, unknown>;
};

export async function pgmqRead(
  pool: pg.Pool,
  queueName: string,
  vtSeconds: number,
  batch: number
): Promise<PgmqMessage[]> {
  const { rows } = await pool.query<PgmqMessage>(
    `SELECT * FROM pgmq_public.read($1::text, $2::integer, $3::integer)`,
    [queueName, vtSeconds, batch]
  );
  return rows;
}

export async function pgmqArchive(
  pool: pg.Pool,
  queueName: string,
  msgId: bigint
): Promise<void> {
  await pool.query(`SELECT pgmq_public.archive($1::text, $2::bigint)`, [
    queueName,
    msgId.toString(),
  ]);
}

/** Permanent removal (e.g. poison message after max retries). */
export async function pgmqDelete(
  pool: pg.Pool,
  queueName: string,
  msgId: bigint
): Promise<void> {
  await pool.query(`SELECT pgmq_public.delete($1::text, $2::bigint)`, [
    queueName,
    msgId.toString(),
  ]);
}
