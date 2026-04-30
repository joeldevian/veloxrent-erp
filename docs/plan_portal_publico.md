# Plan de Implementación: Portal Web Público de Reservas

Este documento detalla la arquitectura y los pasos para implementar la nueva página web pública donde los clientes podrán autogestionar sus reservas, así como el sistema de alertas (campana) para los operadores en el ERP.

## 1. Arquitectura Frontend (React)
Actualmente, el sistema bloquea todo acceso si no estás logueado. Vamos a separar las rutas:
- **Rutas Protegidas (ERP):** `/`, `/fleet`, `/contracts`, etc.
- **Ruta Pública (Web):** `/reserva` o `/catalogo`

Se crearán dos componentes principales:
1. `PublicCatalog.jsx`: Una página tipo "Landing" atractiva (usando los estilos de la foto de referencia, destacando precios, beneficios y foto del auto).
2. `PublicReservationForm.jsx`: Un modal/pantalla donde el cliente ingresa sus datos (Nombre, DNI, Teléfono, Destino, Fechas).

## 2. Conexión a la Base de Datos (Backend Seguro)
**¿Cómo se conectará a la BD sin riesgos?**
Utilizaremos la misma base de datos (Supabase) y el mismo Backend Node.js actual, pero crearemos un canal específico y seguro para el público:

Se creará un nuevo archivo `public.routes.js` en el backend con dos endpoints que **NO requieren token de acceso**:
- `GET /api/public/vehicles`: Solo devolverá vehículos que tengan `status = 'disponible'`. Ocultará datos sensibles del vehículo (como mantenimientos o historial).
- `POST /api/public/reservations`: 
  - Recibirá los datos del vehículo, fechas y los datos personales del cliente.
  - **Lógica de Cliente:** El sistema buscará si el DNI ya existe en la tabla `clients`. Si no existe, lo creará automáticamente.
  - **Lógica de Contrato:** Creará el registro en `contracts` con estado `'pending'` y dejará la columna `operator_id` en `null` (esto es clave para saber que entró por la web y no por un operador en mostrador).

## 3. Sistema de Notificación (Campana de Alertas)
Para que los administradores se enteren al instante:
1. En el componente `TopBar.jsx` (arriba a la derecha, junto al reloj), añadiremos un icono de campana (`Bell`).
2. Implementaremos una consulta rápida al backend (`GET /api/contracts/alerts`) que se ejecutará en segundo plano cada 15 segundos.
3. Si el sistema detecta contratos en estado `'pending'` cuyo `operator_id` sea nulo, la campana mostrará un **globo rojo** con el número de reservas nuevas.
4. Al hacer clic en la campana, te llevará directo a la lista de "Contratos y Reservas" filtrando las pendientes.

## 4. Pasos de Ejecución (Siguiente Fase)
1. **Paso 1:** Crear las rutas y controladores públicos en el Backend (`public.controller.js`).
2. **Paso 2:** Diseñar la Landing Page (`PublicCatalog.jsx`) en el Frontend.
3. **Paso 3:** Implementar la campana interactiva en el `TopBar.jsx` del ERP.
4. **Paso 4:** Probar el flujo completo (Cliente entra a la URL -> Reserva -> Suena la campana en el ERP -> Operador aprueba).
