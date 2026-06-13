const express = require('express');
const expenseController = require('../controllers/expense.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createExpenseSchema, updateExpenseSchema } = require('../schemas/expense.schema');

const router = express.Router();

router.use(authMiddleware);

router.get('/trip/:tripId', expenseController.getExpenses);
router.post('/', validate(createExpenseSchema), expenseController.createExpense);
router.put('/:id', validate(updateExpenseSchema), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
