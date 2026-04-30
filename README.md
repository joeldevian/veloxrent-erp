# Veloxrent ERP 🚗💨

Veloxrent es un sistema integral de **Enterprise Resource Planning (ERP)** diseñado específicamente para negocios de alquiler de vehículos. La plataforma ofrece una solución completa que abarca desde la reserva pública por parte de los clientes hasta la gestión administrativa detallada de la flota, contratos, mantenimiento y facturación electrónica.

## 🚀 Características Principales

### 🌐 Portal Público
- **Catálogo de Vehículos:** Visualización dinámica de la flota disponible.
- **Reservas en Línea:** Proceso de reserva simplificado con carga de comprobantes de pago (Yape/Plin/Transferencia).
- **Notificaciones en Tiempo Real:** El administrador recibe alertas instantáneas cuando se realiza una nueva reserva.

### 📊 Gestión Administrativa
- **Dashboard Operativo:** Resumen visual de la flota (disponibles, alquilados, en mantenimiento) y alertas de vencimiento de SOAT/Seguros.
- **Control de Flota:** Gestión detallada de vehículos con historial de estados.
- **Gestión de Clientes:** Base de datos centralizada de clientes con historial de alquileres.
- **Contratos y Reservas:** Ciclo de vida completo del contrato (Apertura con fotos, Seguimiento, Cierre con cálculo automático de costos).
- **Caja y Pagos:** Seguimiento diario de ingresos por diferentes métodos de pago.
- **Mantenimiento:** Programación y seguimiento de mantenimientos preventivos y correctivos.

### 🧾 Facturación y cumplimiento
- **Comprobantes Electrónicos:** Emisión de Boletas, Facturas y Notas de Crédito.
- **Integración SUNAT:** Preparado para la conexión con PSE/OSE para el envío de documentos electrónicos.

## 🛠️ Stack Tecnológico

- **Frontend:** React.js, Vite, Lucide React (Icons), SweetAlert2 (Modals).
- **Backend:** Node.js, Express.
- **Base de Datos:** Supabase (PostgreSQL).
- **Estilos:** Vanilla CSS (Modern UI/UX).

## 📦 Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/joeldevian/veloxrent-erp.git
    cd veloxrent-erp
    ```

2.  **Instalar dependencias del Backend:**
    ```bash
    cd backend
    npm install
    ```

3.  **Instalar dependencias del Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la carpeta `backend` con las siguientes credenciales (usa el ejemplo de `.env.example` si existe):
    ```env
    SUPABASE_URL=tu_url_de_supabase
    SUPABASE_KEY=tu_anon_key_de_supabase
    JWT_SECRET=tu_secreto_para_tokens
    PORT=3000
    ```

5.  **Ejecutar el proyecto (Modo Desarrollo):**
    - **Backend:** `npm run dev` (dentro de /backend)
    - **Frontend:** `npm run dev` (dentro de /frontend)

## 🎨 Diseño y UI
El sistema cuenta con una interfaz moderna y elegante, diseñada para ser intuitiva y profesional. Se han implementado modales de **SweetAlert2** para una experiencia de usuario premium y micro-animaciones para suavizar las transiciones.

---
Desarrollado con ❤️ para Veloxrent.
