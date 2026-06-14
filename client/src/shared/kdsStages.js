/**
 * KDS order/item status constants.
 *
 * These values mirror the kds_status column on order_items in the DB.
 * Used by KitchenDisplay to bucket tickets into columns and drive
 * optimistic stage-advancement logic.
 */
export const KDS_STAGES = /** @type {const} */ ({
  TO_COOK:   'to_cook',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
});
