# Knex Patterns

## Basic select
```javascript
db('products').select('*').where('is_active', true)
```

## Dynamic WHERE using .modify() for optional filters
```javascript
db('products')
  .select('*')
  .modify((queryBuilder) => {
    if (filters.category) {
      queryBuilder.where('category', filters.category);
    }
    if (filters.minPrice) {
      queryBuilder.where('price', '>=', filters.minPrice);
    }
  });
```

## Raw escape hatch using db.raw() with bound params (never template string interpolation inside raw)
```javascript
db.raw('SELECT * FROM products WHERE is_active = ? AND category = ?', [true, 'electronics'])
```
