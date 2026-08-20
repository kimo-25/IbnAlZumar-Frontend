// src/utils/roles.js
// المصدر الموحّد لأسماء الأدوار ووجهات التوجيه الافتراضية.

export const ROLES = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER ADMIN",
  STORE_OWNER: "STORE_OWNER",
  MODERATOR: "MODERATOR",
  ONLINE_MANAGER: "ONLINE_MANAGER",
  CASHIER: "CASHIER",
  CUSTOMER: "CUSTOMER",
};

const ROLE_ALIASES = {
  ADMIN: ROLES.ADMIN,
  "SUPER ADMIN": ROLES.SUPER_ADMIN,
  SUPERADMIN: ROLES.SUPER_ADMIN,
  STORE_OWNER: ROLES.STORE_OWNER,
  "STORE OWNER": ROLES.STORE_OWNER,
  OWNER: ROLES.STORE_OWNER,
  MODERATOR: ROLES.MODERATOR,
  ONLINE_MANAGER: ROLES.ONLINE_MANAGER,
  "ONLINE MANAGER": ROLES.ONLINE_MANAGER,
  MANAGER: ROLES.ONLINE_MANAGER,
  CASHIER: ROLES.CASHIER,
  CUSTOMER: ROLES.CUSTOMER,
};

export function normalizeRole(rawRole) {
  const value = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  if (!value) return "";
  const cleaned = String(value).trim().toUpperCase();
  return ROLE_ALIASES[cleaned] || cleaned;
}

const ROLE_PRIORITY = [
  ROLES.SUPER_ADMIN,
  ROLES.STORE_OWNER,
  ROLES.ADMIN,
  ROLES.ONLINE_MANAGER,
  ROLES.MODERATOR,
  ROLES.CASHIER,
  ROLES.CUSTOMER,
];

export function pickPrimaryRole(rawRoleOrRoles) {
  const list = Array.isArray(rawRoleOrRoles) ? rawRoleOrRoles : [rawRoleOrRoles];
  const normalizedList = list.map(normalizeRole).filter(Boolean);

  for (const role of ROLE_PRIORITY) {
    if (normalizedList.includes(role)) return role;
  }
  return normalizedList[0] || "";
}

export const ADMIN_AREA_ROLES = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.STORE_OWNER,
  ROLES.ONLINE_MANAGER,
];

export const MODERATOR_AREA_ROLES = [
  ROLES.MODERATOR,
  ROLES.ONLINE_MANAGER,
  ROLES.STORE_OWNER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

export const STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.STORE_OWNER,
  ROLES.MODERATOR,
  ROLES.ONLINE_MANAGER,
];

// الوجهة الافتراضية لكل دور — بعد اللوجن أو عند زيارة "/"
export function getRoleHomePath(rawRoleOrRoles) {
  const role = pickPrimaryRole(rawRoleOrRoles);

  switch (role) {
    case ROLES.CASHIER:
      return "/pos";
    case ROLES.MODERATOR:
      return "/moderator/dashboard";
    case ROLES.ONLINE_MANAGER:
      return "/admin/operations";
    case ROLES.ADMIN:
    case ROLES.SUPER_ADMIN:
    case ROLES.STORE_OWNER:
      return "/admin/dashboard";
    case ROLES.CUSTOMER:
    default:
      return "/";
  }
}