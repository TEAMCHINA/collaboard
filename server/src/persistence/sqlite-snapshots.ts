import type { BoardElement, BoardSnapshot } from "shared";
import { getDb } from "./sqlite-client.js";

export function saveSnapshot(token: string, elements: BoardElement[], seqNum: number): void {
  const db = getDb();
  const elementsJson = JSON.stringify(elements);
  const timestamp = Date.now();

  db.run(
    `INSERT OR REPLACE INTO board_snapshots (token, elements, seq_num, timestamp)
     VALUES (?, ?, ?, ?)`,
    [token, elementsJson, seqNum, timestamp]
  );
}

export function getLatestSnapshot(token: string): BoardSnapshot | null {
  const db = getDb();
  const result = db.exec(
    `SELECT token, elements, seq_num, timestamp FROM board_snapshots WHERE token = ?`,
    [token]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  return {
    token: row[0] as string,
    elements: JSON.parse(row[1] as string) as BoardElement[],
    seqNum: row[2] as number,
    timestamp: row[3] as number,
  };
}

export function getAllSnapshotTokens(): string[] {
  const db = getDb();
  const result = db.exec(`SELECT token FROM board_snapshots`);
  if (result.length === 0) return [];
  return result[0].values.map((row) => row[0] as string);
}
