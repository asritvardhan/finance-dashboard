/** Client-side mirror of backend rolePermissions */

/** Analyst + admin: full transaction list / detail APIs */
export function canAccessTransactionRecords(role) {
  return role === 'analyst' || role === 'admin'
}

export function canCreateTransaction(role) {
  return role === 'analyst' || role === 'admin'
}

export function canUpdateTransaction(role) {
  return role === 'analyst' || role === 'admin'
}

export function canDeleteTransaction(role) {
  return role === 'admin'
}
