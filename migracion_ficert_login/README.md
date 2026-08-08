# 🚀 Guía de Migración: Base de Datos Ficert + Inicio de Sesión de Repartidores

Esta carpeta contiene todo el diseño visual, interfaz de usuario (HTML/CSS) y la lógica completa de JavaScript para migrar tanto el **Visor/Administrador de Base de Datos Ficert** (Botón Naranja) como el **Sistema de Inicio de Sesión de Repartidores** a un nuevo proyecto.

---

## 📁 Estructura de esta Carpeta (`/migracion_ficert_login/`)

```
/migracion_ficert_login/
│
├── README.md                      <-- Guía paso a paso de migración
├── esquema_base_de_datos.md       <-- Documentación de las colecciones de Firestore necesarias
│
├── base_datos_ficert/             <-- Componente Base de Datos Ficert (Botón Naranja)
│   ├── ficert_component.html      <-- Estructura HTML del panel y visor tipo Excel
│   ├── ficert_styles.css          <-- Estilos CSS para tablas, pestañas y barra fx
│   └── ficert_engine.js           <-- Lógica JS con soporte Firebase Modular v10
│
└── login_repartidor/              <-- Componente Inicio de Sesión de Repartidores
    ├── login_component.html       <-- Pantalla de Login y caja de sesión
    ├── login_styles.css           <-- Estilos rústicos/oscuros para la pantalla de acceso
    └── login_engine.js            <-- Lógica JS de autenticación, sesión y validaciones
```

---

## 🛠️ Requisitos del Nuevo Proyecto

1. **FontAwesome 5/6 & Google Fonts (JetBrains Mono)**
   Asegúrate de incluir en la cabecera `<head>` de tu nuevo proyecto:
   ```html
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-resources/6.0.0/css/all.min.css">
   <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
   ```

2. **Firebase SDK (v10 Modular)**
   El motor JS utiliza la versión modular v10 de Firebase Firestore. Asegúrate de inicializar Firebase con la configuración correspondiente a tu proyecto.

3. **Variables de Entorno (Opcional)**
   - `VITE_FIREBASE_DATABASE_ID`: Nombre de la base de datos de Firestore (si usas una base de datos named instance).

---

## 📌 Paso a Paso para Integrar en tu Nuevo Proyecto

### 1. Integrar el Inicio de Sesión de Repartidor
- Copia el HTML de `login_repartidor/login_component.html` justo dentro de la etiqueta `<body>` de tu nueva página.
- Incluye el CSS `login_repartidor/login_styles.css`.
- Incluye el JS `login_repartidor/login_engine.js` al final de tu archivo script principal.
- Al cargar la página, ejecuta `verificarSesionRepartidor()` para restaurar la sesión guardada en `localStorage`.

### 2. Integrar el Visor de Base de Datos Ficert (Botón Naranja)
- Agrega el botón naranja en tu menú o barra principal:
  ```html
  <button onclick="togglePanelFicert()" style="background: #ef6c00; color: white; border: none; padding: 10px; font-weight: bold; border-radius: 4px; cursor: pointer;">
      <i class="fas fa-database"></i> B.D. Ficert
  </button>
  ```
- Copia el HTML del contenedor en `base_datos_ficert/ficert_component.html` en tu archivo HTML.
- Incluye el CSS `base_datos_ficert/ficert_styles.css`.
- Incluye el JS `base_datos_ficert/ficert_engine.js`.
- La función `initFicertFirebaseGlobal()` se conecta a Firestore y permite manipular dinámicamente cualquier colección (`CAPTURA`, `Pedidos`, `RUTA`, `REPARTIDORES`, `COMISIONES`, etc.).

---

## 📄 Licencia y Compatibilidad
Desarrollado para el suite de Ficert Mensajería. Todos los estilos y scripts han sido aislados para facilitar la importación directa a React, Vite, HTML5 estándar o cualquier framework web.
