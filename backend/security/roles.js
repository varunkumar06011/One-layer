export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  SUPPORT: 'SUPPORT',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  ORDER_MANAGER: 'ORDER_MANAGER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
}

/** Roles that may act on the admin API, weakest first. */
export const ADMIN_ROLES = [
  ROLES.SUPPORT,
  ROLES.CONTENT_MANAGER,
  ROLES.ORDER_MANAGER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
]

const RANK = Object.fromEntries(ADMIN_ROLES.map((role, index) => [role, index]))

export function roleAtLeast(role, minimum) {
  if (!(role in RANK) || !(minimum in RANK)) return false
  return RANK[role] >= RANK[minimum]
}
