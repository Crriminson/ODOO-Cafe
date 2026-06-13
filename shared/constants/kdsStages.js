/** @readonly */
export const KDS_STAGES = /** @type {const} */ ({
  TO_COOK:   'to_cook',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
});

/** Ordered progression — use to validate/advance stage */
export const KDS_STAGE_ORDER = [
  KDS_STAGES.TO_COOK,
  KDS_STAGES.PREPARING,
  KDS_STAGES.COMPLETED,
];
