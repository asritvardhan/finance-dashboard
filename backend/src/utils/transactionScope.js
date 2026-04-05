const { ROLES } = require('../config/roles');

/** Roles that share one org-wide ledger (single-tenant team dashboard). */
const ORG_WIDE_ROLES = [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN];

/**
 * Build a MongoDB match/filter for transactions.
 * Viewer, analyst, and admin see all records; any other role only sees their own.
 */
function orgWideTransactionMatch(req, extra = {}) {
    if (ORG_WIDE_ROLES.includes(req.user.role)) {
        return { ...extra };
    }
    return { user: req.user._id, ...extra };
}

module.exports = {
    ORG_WIDE_ROLES,
    orgWideTransactionMatch,
};
