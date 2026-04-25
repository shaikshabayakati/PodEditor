import type { Instruction } from '@/types/ehp';

/**
 * Compute projected timestamps for all instructions after completed deletes/reorders.
 */
export function computeProjectedTimestamps(instructions: Instruction[]): Instruction[] {
  // Gather completed structural changes
  const completedDeletes = instructions
    .filter((i) => i.type === 'delete' && i.execution_status === 'done' && i.end_time != null)
    .sort((a, b) => a.start_time - b.start_time);

  const completedReorders = instructions
    .filter((i) => i.type === 'reorder' && i.execution_status === 'done' && i.end_time != null && i.destination_start_time != null)
    .sort((a, b) => a.start_time - b.start_time);

  // Build offset map: cumulative duration removed before each point
  function computeOffset(time: number): number {
    let offset = 0;
    for (const del of completedDeletes) {
      if (del.start_time < time) {
        const delEnd = Math.min(del.end_time!, time);
        offset += Math.max(0, delEnd - del.start_time);
      }
    }
    return offset;
  }

  return instructions.map((inst) => {
    const offsetStart = computeOffset(inst.start_time);
    const projected_start_time = Math.max(0, inst.start_time - offsetStart);
    let projected_end_time: number | undefined;
    if (inst.end_time != null) {
      const offsetEnd = computeOffset(inst.end_time);
      projected_end_time = Math.max(0, inst.end_time - offsetEnd);
    }
    return { ...inst, projected_start_time, projected_end_time };
  });
}
