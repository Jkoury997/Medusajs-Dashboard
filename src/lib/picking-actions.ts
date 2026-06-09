// Mapa compartido de acciones de auditoría del pickup-system → etiqueta legible
// + color del badge. Los valores coinciden con los que registra el backend
// (item_pick, session_complete, order_ship, wave_*, api_key_*, etc.).

export const ACTION_CONFIG: Record<string, { label: string; className: string }> = {
  // Picking
  session_start: { label: "Inicio picking", className: "bg-blue-100 text-blue-700" },
  session_complete: { label: "Picking completado", className: "bg-green-100 text-green-700" },
  session_cancel: { label: "Picking cancelado", className: "bg-red-100 text-red-700" },
  item_pick: { label: "Item pickeado", className: "bg-green-100 text-green-700" },
  item_unpick: { label: "Item removido", className: "bg-yellow-100 text-yellow-700" },
  item_missing: { label: "Item faltante", className: "bg-red-100 text-red-700" },
  // Envío
  order_pack: { label: "Empaquetado", className: "bg-purple-100 text-purple-700" },
  fulfillment_create: { label: "Fulfillment creado", className: "bg-blue-100 text-blue-700" },
  fulfillment_error: { label: "Error fulfillment", className: "bg-red-100 text-red-700" },
  order_ship: { label: "Enviado", className: "bg-indigo-100 text-indigo-700" },
  order_ship_store: { label: "Enviado a tienda", className: "bg-indigo-100 text-indigo-700" },
  order_deliver: { label: "Entregado", className: "bg-green-100 text-green-700" },
  // Olas
  wave_create: { label: "Ola creada", className: "bg-blue-100 text-blue-700" },
  wave_cancel: { label: "Ola cancelada", className: "bg-red-100 text-red-700" },
  wave_pick: { label: "Ola: recolección", className: "bg-green-100 text-green-700" },
  wave_pick_complete: { label: "Ola: recolección lista", className: "bg-green-100 text-green-700" },
  wave_sort: { label: "Ola: sorting", className: "bg-purple-100 text-purple-700" },
  wave_order_ready: { label: "Ola: pedido listo", className: "bg-green-100 text-green-700" },
  // Usuarios / seguridad
  user_create: { label: "Usuario creado", className: "bg-pink-100 text-pink-700" },
  user_update: { label: "Usuario actualizado", className: "bg-yellow-100 text-yellow-700" },
  user_delete: { label: "Usuario eliminado", className: "bg-red-100 text-red-700" },
  api_key_create: { label: "API key creada", className: "bg-pink-100 text-pink-700" },
  api_key_revoke: { label: "API key revocada", className: "bg-red-100 text-red-700" },
  // Sesión
  login: { label: "Login", className: "bg-gray-100 text-gray-700" },
  admin_login: { label: "Login admin", className: "bg-gray-100 text-gray-700" },
  store_login: { label: "Login tienda", className: "bg-gray-100 text-gray-700" },
}

// Opciones del filtro de acción, agrupadas.
export const ACTION_FILTER_GROUPS: { group: string; actions: string[] }[] = [
  { group: "Picking", actions: ["session_start", "session_complete", "session_cancel", "item_pick", "item_unpick", "item_missing"] },
  { group: "Envío", actions: ["order_pack", "fulfillment_create", "fulfillment_error", "order_ship", "order_ship_store", "order_deliver"] },
  { group: "Olas", actions: ["wave_create", "wave_cancel", "wave_pick", "wave_pick_complete", "wave_sort", "wave_order_ready"] },
  { group: "Usuarios / Seguridad", actions: ["user_create", "user_update", "user_delete", "api_key_create", "api_key_revoke"] },
  { group: "Sesión", actions: ["login", "admin_login", "store_login"] },
]

export function getActionConfig(action: string): { label: string; className: string } {
  return ACTION_CONFIG[action] ?? { label: action, className: "bg-gray-100 text-gray-700" }
}
