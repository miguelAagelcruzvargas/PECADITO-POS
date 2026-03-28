export const PERMISOS_SIDEBAR = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'configuraciones', label: 'Configuraciones' }
];

// Permisos que sí se pueden asignar a empleados en el modal de usuarios.
export const PERMISOS_EMPLEADO = PERMISOS_SIDEBAR.filter((p) => p.id !== 'usuarios');

export const parsePermisos = (permisosRaw) => {
  if (!permisosRaw) return [];
  try {
    const parsed = typeof permisosRaw === 'string' ? JSON.parse(permisosRaw) : permisosRaw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const hasPermiso = (permisos, requiredPerm) => {
  const list = Array.isArray(permisos) ? permisos : [];

  if (list.includes(requiredPerm)) return true;

  // Compatibilidad con permisos legacy
  if (requiredPerm === 'inventario' && list.includes('toppings')) return true;
  if (requiredPerm === 'configuraciones' && list.includes('menu_digital')) return true;

  return false;
};
