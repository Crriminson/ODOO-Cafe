const expenseService = require('../services/expense.service');
const apiResponse = require('../utils/apiResponse');

exports.getExpenses = async (req, res, next) => {
  try {
    const expenses = await expenseService.getExpenses(req.params.tripId, req.user.id);
    res.status(200).json(apiResponse.success(expenses));
  } catch (err) {
    next(err);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.user.id, req.body);
    res.status(201).json(apiResponse.success(expense, 'Expense created'));
  } catch (err) {
    next(err);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.user.id, req.body);
    res.status(200).json(apiResponse.success(expense, 'Expense updated'));
  } catch (err) {
    next(err);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
