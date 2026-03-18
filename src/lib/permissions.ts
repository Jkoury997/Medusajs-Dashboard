/**
 * Sistema de permisos del dashboard.
 *
 * Cada usuario tiene un "role" almacenado en su metadata de Medusa.
 * Cada rol tiene un conjunto de permisos (Permission[]).
 * Las rutas y secciones del sidebar se asocian a un permiso.
 */

// ============================================================
// PERMISOS
// ============================================================

export const PERMISSIONS = {
  // Dashboard principal
  DASHBOARD_VIEW: "dashboard:view",

  // Órdenes
  ORDERS_VIEW: "orders:view",

  // Productos
  PRODUCTS_VIEW: "products:view",

  // Clientes
  CUSTOMERS_VIEW: "customers:view",

  // Marketing
  MARKETING_VIEW: "marketing:view",

  // Email Marketing
  EMAIL_MARKETING_VIEW: "email_marketing:view",

  // Picking
  PICKING_VIEW: "picking:view",

  // Revendedoras online
  RESELLERS_VIEW: "resellers:view",

  // Revendedoras físicas
  RESELLERS_FISICAS_VIEW: "resellers_fisicas:view",

  // Administración (pagos, documentos, retiros)
  ADMIN_VIEW: "admin:view",

  // Analítica
  ANALYTICS_VIEW: "analytics:view",

  // IA Insights
  AI_VIEW: "ai:view",

  // Gestión de roles (solo super_admin)
  ROLES_MANAGE: "roles:manage",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// ============================================================
// ROLES
// ============================================================

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MARKETING: "marketing",
  PICKING: "picking",
  VENTAS: "ventas",
  VIEWER: "viewer",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  marketing: "Marketing",
  picking: "Picking",
  ventas: "Ventas",
  viewer: "Solo Lectura",
}

/**
 * Permisos por rol.
 * super_admin tiene todos los permisos.
 * Los demás roles tienen subconjuntos.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),

  admin: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.EMAIL_MARKETING_VIEW,
    PERMISSIONS.PICKING_VIEW,
    PERMISSIONS.RESELLERS_VIEW,
    PERMISSIONS.RESELLERS_FISICAS_VIEW,
    PERMISSIONS.ADMIN_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AI_VIEW,
  ],

  marketing: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.EMAIL_MARKETING_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  picking: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.PICKING_VIEW,
  ],

  ventas: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.RESELLERS_VIEW,
    PERMISSIONS.RESELLERS_FISICAS_VIEW,
  ],

  viewer: [
    PERMISSIONS.DASHBOARD_VIEW,
  ],
}

// ============================================================
// MAPEO RUTA → PERMISO
// ============================================================

/**
 * Mapea prefijos de ruta a permisos requeridos.
 * Se evalúan en orden: el primer match gana.
 */
export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  // Administración
  { prefix: "/dashboard/administracion", permission: PERMISSIONS.ADMIN_VIEW },

  // Productos
  { prefix: "/dashboard/products", permission: PERMISSIONS.PRODUCTS_VIEW },

  // Órdenes
  { prefix: "/dashboard/orders", permission: PERMISSIONS.ORDERS_VIEW },

  // Clientes
  { prefix: "/dashboard/customers", permission: PERMISSIONS.CUSTOMERS_VIEW },

  // Marketing
  { prefix: "/dashboard/marketing", permission: PERMISSIONS.MARKETING_VIEW },

  // Email marketing (todas las sub-rutas)
  { prefix: "/dashboard/carritos-abandonados", permission: PERMISSIONS.EMAIL_MARKETING_VIEW },
  { prefix: "/dashboard/campaigns", permission: PERMISSIONS.EMAIL_MARKETING_VIEW },
  { prefix: "/dashboard/email-marketing", permission: PERMISSIONS.EMAIL_MARKETING_VIEW },
  { prefix: "/dashboard/contacts", permission: PERMISSIONS.EMAIL_MARKETING_VIEW },
  { prefix: "/dashboard/segments", permission: PERMISSIONS.EMAIL_MARKETING_VIEW },
  { prefix: "/dashboard/templates", permission: PERMISSIONS.EMAIL_MARKETING_VIEW },
  { prefix: "/dashboard/email-stats", permission: PERMISSIONS.EMAIL_MARKETING_VIEW },

  // Picking
  { prefix: "/dashboard/picking", permission: PERMISSIONS.PICKING_VIEW },

  // Revendedoras online
  { prefix: "/dashboard/resellers", permission: PERMISSIONS.RESELLERS_VIEW },
  { prefix: "/dashboard/product-boosts", permission: PERMISSIONS.RESELLERS_VIEW },

  // Revendedoras físicas
  { prefix: "/dashboard/resellers-fisicas", permission: PERMISSIONS.RESELLERS_FISICAS_VIEW },

  // Analítica
  { prefix: "/dashboard/analytics", permission: PERMISSIONS.ANALYTICS_VIEW },

  // IA
  { prefix: "/dashboard/ai", permission: PERMISSIONS.AI_VIEW },

  // Gestión de roles
  { prefix: "/dashboard/roles", permission: PERMISSIONS.ROLES_MANAGE },
]

/**
 * Dado un pathname, devuelve el permiso requerido (o null si es acceso libre).
 */
export function getRequiredPermission(pathname: string): Permission | null {
  for (const { prefix, permission } of ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return permission
    }
  }
  // /dashboard sin sufijo es acceso libre (todos lo ven)
  return null
}

/**
 * Verifica si un rol tiene un permiso específico.
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Mapeo de secciones del sidebar a permisos.
 * La key es el label del NavEntry o NavGroup.
 */
export const SIDEBAR_PERMISSIONS: Record<string, Permission> = {
  "Resumen": PERMISSIONS.DASHBOARD_VIEW,
  "Órdenes": PERMISSIONS.ORDERS_VIEW,
  "Productos": PERMISSIONS.PRODUCTS_VIEW,
  "Clientes": PERMISSIONS.CUSTOMERS_VIEW,
  "Marketing": PERMISSIONS.MARKETING_VIEW,
  "Email Marketing": PERMISSIONS.EMAIL_MARKETING_VIEW,
  "Picking": PERMISSIONS.PICKING_VIEW,
  "Revendedoras": PERMISSIONS.RESELLERS_VIEW,
  "Revendedoras Físicas": PERMISSIONS.RESELLERS_FISICAS_VIEW,
  "Administración": PERMISSIONS.ADMIN_VIEW,
  "Analítica": PERMISSIONS.ANALYTICS_VIEW,
  "IA Insights": PERMISSIONS.AI_VIEW,
  "Gestión de Roles": PERMISSIONS.ROLES_MANAGE,
}
