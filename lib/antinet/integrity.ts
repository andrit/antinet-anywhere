/**
 * Pure referential-integrity logic. The only non-I/O decision in deletion: when a Main card is
 * deleted, split the Index cards that reference it into those to DELETE (it was their sole entry
 * point — removing it would leave an empty, invalid Index card) and those to PULL it from.
 * See design/slice-3-referential-integrity.md.
 */
export interface IndexRef {
  _id: string;
  entryPoints: string[];
}

export interface IndexRefPartition {
  deleteKeywords: string[];
  pullKeywords: string[];
}

/**
 * `refs` are Index cards that all contain `address` in entryPoints. A card whose only entry point is
 * `address` is slated for deletion; any other has `address` pulled, keeping it valid (≥ 1 entry).
 */
export function partitionIndexRefs(refs: readonly IndexRef[]): IndexRefPartition {
  const deleteKeywords: string[] = [];
  const pullKeywords: string[] = [];
  for (const ref of refs) {
    if (ref.entryPoints.length <= 1) {
      deleteKeywords.push(ref._id);
    } else {
      pullKeywords.push(ref._id);
    }
  }
  return { deleteKeywords, pullKeywords };
}
