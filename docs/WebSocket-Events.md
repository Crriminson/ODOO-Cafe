# WebSocket Events Contract

> **This document is frozen.**
> All events use a single global Socket.IO namespace (`/`).
> KDS connects once and receives all events — **client filters by product/category client-side**.
> Server emits; KDS listens. No client→server events are defined at this stage.

---

## Connection

```js
// KDS client connect (client/.env → VITE_SOCKET_URL)
import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_SOCKET_URL);
```

---

## Events

### `order:new`
**Direction:** Server → all connected clients
**Trigger:** `POST /orders/:id/send` succeeds (status becomes `sent`)

**Payload:**
```json
{
  "id":         5,
  "order_type": "dine_in",
  "table_id":   3,
  "status":     "sent",
  "created_at": "2024-06-13T10:30:00.000Z",
  "items": [
    {
      "id":                  1,
      "order_id":            5,
      "product_id":          1,
      "product_name":        "Espresso",
      "category_id":         1,
      "show_on_kds":         true,
      "quantity":            2,
      "unit_price":          "120.00",
      "kds_status":          "to_cook",
      "is_item_completed":   false,
      "assigned_cook_id":    1,
      "assigned_cook_name":  "Chef Raj"
    }
  ]
}
```

> Only items with `show_on_kds = true` are included in the `items` array.
> `assigned_cook_id` and `assigned_cook_name` may be `null` if allocation fails.

---

### `order:stage_updated`
**Direction:** Server → all connected clients
**Trigger:** `PUT /kds/orders/:id/stage` succeeds

**Payload:**
```json
{
  "order_id":  5,
  "kds_status": "preparing"
}
```

> `kds_status` is the **new** stage value.
> Valid values: `"to_cook"` | `"preparing"` | `"completed"`
> KDS updates the entire ticket card's stage indicator.

---

### `item:completed`
**Direction:** Server → all connected clients
**Trigger:** `PUT /kds/items/:id/complete` succeeds

**Payload:**
```json
{
  "order_id":          5,
  "item_id":           1,
  "is_item_completed": true
}
```

> KDS applies strikethrough to the specific item row.
> `is_item_completed` is always `true` in this event (items are not un-completed).

---

### `order:paid`
**Direction:** Server → all connected clients
**Trigger:** `POST /orders/:id/pay` succeeds (status becomes `paid`)

**Payload:**
```json
{
  "order_id": 5
}
```

> KDS removes the ticket card for this order from the display entirely.

---

## KDS Client Recipe

```js
socket.on('order:new',           (order)   => { /* add ticket to board */ });
socket.on('order:stage_updated', (payload) => { /* update stage of ticket */ });
socket.on('item:completed',      (payload) => { /* strikethrough item */ });
socket.on('order:paid',          (payload) => { /* remove ticket from board */ });
```

---

## Server Emit Recipe

```js
// server/src/websocket/kds.emitter.js
import { getIO } from './index.js';

export const emitNewOrder        = (order)              => getIO().emit('order:new',           order);
export const emitStageUpdated    = (orderId, newStage)  => getIO().emit('order:stage_updated', { order_id: orderId, kds_status: newStage });
export const emitItemCompleted   = (orderId, itemId)    => getIO().emit('item:completed',      { order_id: orderId, item_id: itemId, is_item_completed: true });
export const emitOrderPaid       = (orderId)            => getIO().emit('order:paid',           { order_id: orderId });
```

---

## ⚠️ Ambiguities Flagged

| # | Issue | Decision |
|---|---|---|
| 1 | **`cook:assigned`** — the emitter file has a 5th event not in spec | **Removed from contract.** Cook assignment is included in the `order:new` payload (`assigned_cook_id`). No separate `cook:assigned` event. |
| 2 | **POS real-time updates** — does the POS terminal also listen to WebSocket? | **Not in scope for this contract.** POS re-fetches via REST on user action. |
