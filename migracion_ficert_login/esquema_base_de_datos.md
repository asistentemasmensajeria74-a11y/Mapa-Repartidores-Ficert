# 🗄️ Esquema de Base de Datos en Firestore (Ficert Suite)

Para que el Inicio de Sesión de Repartidor y la Base de Datos Ficert funcionen correctamente en el nuevo proyecto, debes contar con las siguientes colecciones en Firestore con sus respectivos campos.

---

## 1. Colección `REPARTIDORES`
Almacena los datos del personal de entregas para validar el acceso al sistema.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `REPA_CORREO` | String | Correo electrónico de acceso del repartidor | `contratista@correo.com` |
| `CONTRASEÑA` | String | Contraseña de acceso en texto plano o hash | `123456` |
| `ID_REPA` | String / Number | Identificador único numérico o código del repartidor | `1` o `"REPA-01"` |
| `REPA_NOMBRE` | String | Nombre completo del repartidor | `JUAN PÉREZ` |
| `REPA_RUTA` | String / Number | Número de la ruta asignada | `1` |
| `REPA_ESTADO` | String | Estado operativo actual | `"DISPONIBLE"` / `"INACTIVO"` |
| `PAGO DE LA SEMANA` | Number | Monto acumulado de pago | `1500.00` |
| `COMISION` | Number | Porcentaje o monto de comisión por entrega | `0.15` (15%) |

---

## 2. Colección `COMISIONES`
Registra el historial de comisiones generadas por cada envío entregado.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `ID_COMISIONES` | String | ID autonumérico o identificador | `"COM-10024"` |
| `ID_ENV_COM` | String | ID o NGUIA del envío entregado | `"10024"` |
| `ID_REPA_COM` | String / Number | ID del repartidor que entregó | `1` |
| `PAGO_COM` | Number | Valor de la comisión calculada | `45.00` |
| `ESTADO_COM` | String | Estado del pago de la comisión | `"PENDIENTE"` / `"PAGADO"` |

---

## 3. Colección `Pedidos`
Registra los pedidos y solicitudes activas asignadas a repartidores.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `nguia` / `NGUIA` | String | Número de guía único | `"10024"` |
| `nombreDestinatario` | String | Nombre de quien recibe | `"PEDRO LÓPEZ"` |
| `direccion` | String | Dirección de entrega | `"CALLE HIDALGO 123"` |
| `estado` | String | Estado del pedido | `"ACEPTADO"`, `"EN RUTA"`, `"ENTREGADO"` |
| `idMensajero` | String | ID del repartidor asignado | `"1"` |
| `total` / `PRECIO` | Number | Cobro al cliente | `250.00` |

---

## 4. Colecciones Auxiliares Atendidas por B.D. Ficert (Botón Naranja)
El visor de Base de Datos Ficert lee y edita automáticamente las siguientes colecciones:
- `CAPTURA`: Registros crudos de entrada de paquetes.
- `RUTA`: Secuencia de entrega de rutas activas.
- `REP_DIA`: Resumen diario por repartidor.
- `USUARIOS` / `Usuarios_Seguridad`: Gestión de accesos administrativos.
- `Tarifas`: Lista de costos y zonas.
