export const ALLOWED_STAGES = new Set([
  "$match",
  "$group",
  "$project",
  "$sort",
  "$limit",
  "$unwind",
  "$addFields",
]);

export const BLOCKED_STAGES = new Set([
  "$out",
  "$merge",
  "$where",
  "$function",
  "$accumulator",
]);