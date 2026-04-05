/** Mirrors backend ALL_CATEGORIES + TRANSACTION_TYPES */

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
}

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Other Income',
]

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Rent',
  'Insurance',
  'Other Expense',
]

export function categoriesForType(type) {
  return type === TRANSACTION_TYPES.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}
