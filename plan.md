Listed directory multi-pos-main
Listed directory src
Listed directory src
Listed directory routes
Listed directory models
Listed directory pages
Listed directory admin
Listed directory components
Viewed db.js:1-382
Viewed users.model.js:1-91
Viewed App.jsx:1-92
Viewed turnos.routes.js:1-13
Listed directory controllers
Viewed Dashboard.jsx:1-85
Viewed turnos.controller.js:1-179
Viewed configuracion.controller.js:1-277
Listed directory empleado
Viewed Dashboard.Emp.jsx:1-56
Viewed configuracion.routes.js:1-21
Viewed usuarios.routes.js:1-30
Viewed usuarios.controller.js:1-303
Viewed ConfigMenu.jsx:1-541

Ahora tengo suficiente contexto del proyecto. Déjame crear un plan de implementación detallado para todas las funcionalidades pendientes.

Viewed pedidos_digitales.routes.js:1-28
Listed directory context
Viewed TurnoContext.jsx:1-55
Viewed UsuariosContext.jsx:1-201

Ya tengo todo el contexto necesario. Ahora voy a crear el plan de implementación completo como artefacto.

Listed directory antigravity

Revisé el proyecto a fondo. Aquí está el **plan de implementación completo** para todas las funcionalidades, ya que no puedo crear el artefacto fuera del directorio aprobado por el sistema:

---

## 🗺️ Plan de Implementación — PECADITO POS

He analizado toda la base de código. Esto es lo que hay que construir, organizado en 4 módulos:

---

### MÓDULO 1 — Catálogo Digital: Métodos de Pago *(Media)*

**Backend:**
- **`db.js`**: Nueva columna `metodo_pago ENUM('contra_entrega','transferencia')` en `pedidos_digitales`; columnas `banco_nombre`, `banco_titular`, `banco_cuenta`, `banco_clabe`, `banco_concepto` en `configuraciones`
- **`configuracion.controller.js`**: Incluir campos `banco_*` en `getConfig`/`updateConfig`; agregar endpoint **público** `GET /configuraciones/:id_negocio/transferencia` (sin auth)
- **`pedidos_digitales.controller.js`**: Guardar `metodo_pago` al crear pedido

**Frontend:**
- **`ConfigMenu.jsx`**: Nueva sección "Datos de Transferencia" con formulario de datos bancarios
- **`MenuDigital.jsx`**: Selector de método de pago al hacer el pedido; si elige transferencia → mostrar tarjeta con datos bancarios del negocio

---

### MÓDULO 2 — Gestión de Empleados *(Alta)*

**Backend:**
- **`db.js`**: Columnas `horario_entrada TIME`, `horario_salida TIME`, `tipo_turno ENUM('completo','medio_turno')` en `usuarios`
- **`usuarios.controller.js`**: Función `crearEmpleado` que genera email + contraseña aleatoria automáticamente y los retorna una sola vez
- **`usuarios.routes.js`**: Ruta `POST /empleados/generar`
- **`turnos.controller.js`**: Aceptar `monto_final_declarado` al cerrar; calcular `total_efectivo` y `total_transferencia`

**Frontend:**
- **Nuevo `Empleados.jsx`**: Formulario con nombre + horario + tipo turno; muestra credenciales generadas
- **`Login.jsx`**: Si el empleado no tiene turno activo → modal "Apertura de Caja" antes de redirigir
- **`Dashboard.Emp.jsx`**: Modal de cierre con desglose efectivo / transferencia + campo para declarar monto

---

### MÓDULO 3 — Cierre de Caja Mejorado *(Media)*

**Backend:**
- **`db.js`**: Columnas `monto_final_declarado`, `total_efectivo`, `total_transferencia` en tabla `turnos`
- **`turnos.controller.js`**: Calcular montos separados por método de pago; incluir `monto_esperado_caja` y `diferencia_caja` en el reporte

**Frontend:**
- **`TurnoControl.jsx`**: Modal de cierre con efectivo esperado, total transferencias, campo de monto real declarado, indicador verde/rojo de diferencia
- **`Dashboard.jsx`**: Widget "Resumen de Turnos del Día" con desglose por empleado

---

### MÓDULO 4 — Gestión de Caja: Ingresos y Egresos *(Media)*

**Backend:**
- **`db.js`**: Nueva tabla `movimientos_caja` (tipo ingreso/egreso, concepto, monto, turno_id)
- **Nuevos**: `caja.routes.js`, `caja.controller.js` con endpoints para registrar y listar movimientos
- **`app.js`**: Registrar el nuevo router

**Frontend:**
- **Nuevo `GestionCaja.jsx`**: Balance de caja, botones Ingreso/Egreso, lista de movimientos del turno
- **`Dashboard.Emp.jsx`**: Tarjeta "Caja" con link a `/gestion-caja`

---

## 🗂️ Orden de Implementación

```
1 → Módulo 1: Métodos de pago (impacto en clientes ya hoy)
2 → Módulo 3: Cierre mejorado (base técnica necesaria)
3 → Módulo 2: Sistema de empleados con horarios
4 → Módulo 4: Gestión de movimientos de caja
```

---

**¿Cómo quieres proceder?**

- ¿Empezamos con el **Módulo 1** completo (métodos de pago + datos bancarios)?
- ¿O prefieres otro módulo primero?
- ¿Implementamos todo de una vez o módulo por módulo?