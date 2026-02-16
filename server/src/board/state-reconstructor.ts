import type { BoardElement, BoardState, BoardSnapshot, Operation } from "shared";
import { reconstructState } from "shared";

export function reconstructBoard(
  token: string,
  snapshot: BoardSnapshot | null,
  ops: Operation[]
): BoardState {
  const baseElements = snapshot ? snapshot.elements : [];
  const baseSeqNum = snapshot ? snapshot.seqNum : 0;

  // Only replay ops that came after the snapshot
  const newOps = ops.filter((op) => op.seqNum > baseSeqNum);
  const elements = reconstructState(baseElements, newOps);

  let maxZIndex = 0;
  for (const el of elements.values()) {
    if (el.zIndex >= maxZIndex) maxZIndex = el.zIndex + 1;
  }

  const lastSeqNum = newOps.length > 0 ? newOps[newOps.length - 1].seqNum : baseSeqNum;

  return {
    token,
    elements,
    nextZIndex: maxZIndex,
    seqNum: lastSeqNum,
  };
}
