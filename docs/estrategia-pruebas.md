# Estrategia de pruebas: integración entre microservicios mediante API REST

**Equipo 1:** Valentina Álvarez Paniagua, Miguel Ángel Giraldo, Santiago Castaño Torres

| Elemento | Estrategia |
|---|---|
| **Objetivo** | Validar que Pedidos e Inventario se comuniquen correctamente por REST y que el sistema reaccione de forma controlada cuando la integración falla o recibe datos inválidos. |
| **Componentes incluidos** | Servicio de Pedidos (8001), Servicio de Inventario (8002) y las pruebas automatizadas (Vitest). |
| **Puntos de integración** | 1) `POST /reservas` de Pedidos hacia Inventario. 2) Traducción de respuestas 200, 404 y 409. 3) Manejo de falla de red, de error 500 y de tiempo de espera. 4) Propagación del `x-request-id`. |
| **Riesgos** | R1 datos inválidos llegan a Inventario. R2 producto inexistente. R3 stock insuficiente. R4 Inventario caído o con errores. R5 Inventario lento. R6 inconsistencia entre pedido y stock. |
| **Alcance** | Comunicación síncrona REST, validaciones, errores funcionales, fallas técnicas y un flujo completo. |
| **Exclusiones** | Autenticación, base de datos real, nube, contenedores, pruebas de carga y concurrencia. |
| **Ambiente** | Computador local, Node.js 18 o superior, dos procesos en localhost. |
| **Datos de prueba** | Ficticios: P001 Cuaderno (stock 10), P002 Lapicero (stock 3). Se restauran con `/admin/reset` antes de cada caso. |
| **Dependencias reales** | Ambos servicios corriendo como procesos reales comunicados por HTTP. |
| **Dependencias simuladas** | La lentitud (`/admin/demora`) y el error 500 (`/admin/falla`) de Inventario; en las pruebas de componente, Inventario completo se reemplaza por un doble (`vi.fn()`). La caída se provoca apagando el proceso de verdad. |
| **Herramientas** | Express, zod, axios, pino, swagger-ui-express, Vitest, supertest. Todas gratuitas. |
| **Criterio aprobado / fallido** | Aprobado: el código HTTP, el código de error y el estado final (stock y pedidos) coinciden con lo esperado. Fallido: algo no coincide, el sistema se cuelga o queda inconsistente. |

## Niveles de prueba del repositorio

| Nivel | Carpeta | Qué valida |
|---|---|---|
| Unitaria | `tests/unit` | Validadores zod y traducción de errores de red |
| Componente | `tests/component` | Pedidos real con Inventario simulado |
| Integración y sistema | `tests/integration` | Dos servicios reales hablando por HTTP (CP-01 a CP-08) |

## Trazabilidad riesgo → caso

| Riesgo | Casos |
|---|---|
| R1 | CP-02 |
| R2 | CP-03 |
| R3 | CP-04 |
| R4 | CP-05, CP-08 |
| R5 | CP-06 |
| R6 | CP-01, CP-02, CP-07, CP-08 |

Casos automatizados exigidos por la guía: exitoso (CP-01), validación (CP-02) y falla técnica (CP-05). Aquí se automatizan los ocho.

## Limitaciones conocidas

Si Inventario reserva y Pedidos falla antes de guardar, el stock quedaría descontado sin pedido (se resolvería con una compensación o patrón saga). Con datos en memoria y sin bloqueo, dos pedidos simultáneos por la última unidad podrían descontarse mal (se resolvería con transacciones en una base de datos real).
