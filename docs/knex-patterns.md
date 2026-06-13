# Knex Query Patterns

All query files import `{ db }` from `'../../config/db.js'`. Do not create a second Knex instance.

## Basic select
```js
db('products').select('*').where('is_active', true)
```

## Dynamic WHERE
```js
db('orders')
  .where('session_id', sessionId)
  .modify(qb => { if (status) qb.where('status', status); })
  .modify(qb => { if (search) qb.whereIlike('id::text', `%${search}%`); })
  .orderBy('created_at', 'desc')
```

## Raw escape hatch (CTEs / window functions / JSONB)
```js
db.raw(
  `WITH ranked AS (...) SELECT ... WHERE id = ?`,
  [orderId]
)
```
