# Laboratorio: pruebas de integración entre microservicios mediante API REST

**Equipo 1:** Valentina Álvarez Paniagua, Miguel Ángel Giraldo y Santiago Castaño Torres.

Dos microservicios en Node.js, **Pedidos** (puerto 8001) e **Inventario** (puerto 8002), se comunican por HTTP de forma síncrona. Cuando se crea un pedido, Pedidos le pide a Inventario que reserve el stock y espera la respuesta (timeout de 2 s). El laboratorio prueba qué pasa cuando la integración funciona y cuando falla.

Todo corre local, con datos ficticios y herramientas gratuitas.

## Requisitos

Node.js 18 o superior (probado con Node 22). Nada más.

## Instalación

```bash
npm install
```

## Ejecutar los servicios (para la demo)

```bash
npm start
```

Esto levanta ambos servicios en una sola terminal. Si prefieren dos terminales, como en la demo: `npm run start:inventario` y `npm run start:pedidos`.

Documentación Swagger (también sirve para probar a mano):
- Pedidos: http://localhost:8001/docs
- Inventario: http://localhost:8002/docs

También hay peticiones listas en `docs/demo/requests.http` (extensión REST Client de VS Code).

## Ejecutar las pruebas

```bash
npm test              # todas: unitarias, de componente e integración
npm run evidencia     # corre todo y genera el informe y la matriz de casos
```

Los servicios para las pruebas de integración se levantan solos (puertos 9001 y 9002, para no chocar con la demo).

Archivos que quedan en `evidencias/`: `informe-casos.md`, `matriz-casos-prueba.csv` (los 12 campos que pide la guía, ábrelo en Excel), `junit.xml`, `resultado.json` y `logs/pedidos.log` e `inventario.log`.

## Guion de demo en vivo

1. `npm start` y abrir los dos Swagger.
2. Inventario: `GET /productos/P001` muestra stock 10.
3. Pedidos: `POST /pedidos` con `{"producto_id":"P001","cantidad":2}` responde 201; el stock pasa a 8 (CP-01).
4. Pedidos: `POST /pedidos` con cantidad `-5` responde 400, y `GET /admin/estadisticas` en Inventario prueba que no fue llamado (CP-02).
5. Falla técnica: Ctrl+C en la terminal de Inventario y repetir el pedido; responde 503 (CP-05). `GET /health/dependencias` muestra que Pedidos sigue vivo.
6. Lentitud: con Inventario activo, `POST /admin/demora` `{"segundos":5}` y crear un pedido; responde 504 a los 2 s (CP-06).
7. Cerrar con `npm run evidencia` y mostrar `evidencias/informe-casos.md`.

## Casos de prueba

| ID | Caso | Tipo | Resultado esperado |
|---|---|---|---|
| CP-01 | Pedido exitoso | Integración | 201 y stock 10 → 8 |
| CP-02 | Cantidad inválida | Integración | 400 y Inventario no es llamado |
| CP-03 | Producto inexistente | Integración | 404 propagado |
| CP-04 | Stock insuficiente | Integración | 409 y sin pedido |
| CP-05 | Inventario caído | Integración (falla técnica) | 503 y Pedidos sigue vivo |
| CP-06 | Inventario lento | Integración (falla técnica) | 504 a los ~2 s |
| CP-07 | Flujo completo | Sistema | Pedido consultable y stock 3 → 2 |
| CP-08 | Inventario responde 500 | Integración | 502 y sin pedido |

El detalle de los 12 campos de cada caso está en `docs/casos.json` y se completa con los resultados al correr `npm run evidencia`. **CP-05 apaga Inventario, por eso debe quedar siempre al final del archivo de integración.**

## Estructura

```
services/
  inventario/src/   app, rutas, schemas (zod), store, openapi, server
  pedidos/src/      app, schemas (zod), cliente HTTP a Inventario, servicio, openapi, server
tests/
  unit/             validadores y traducción de errores
  component/        Pedidos real + Inventario simulado (supertest)
  integration/      dos servicios reales por HTTP (CP-01 a CP-08)
  helpers/          levantar/apagar servicios, cliente HTTP, evidencias
scripts/            informe.js, evidencia.js
docs/               arquitectura, estrategia de pruebas, casos, referencias, demo
evidencias/         resultados de las pruebas
```

## Librerías

Express (servidor), zod (validación y configuración), axios (cliente HTTP con timeout), pino y pino-http (logs con `x-request-id`), helmet y cors (seguridad básica), swagger-ui-express (documentación OpenAPI), Vitest y supertest (pruebas).

## Variables de entorno

Ver `.env.example`. Las más útiles: `PORT`, `INVENTARIO_URL`, `INVENTARIO_TIMEOUT_MS` y `ENABLE_ADMIN` (poner `false` desactiva los endpoints `/admin`).

## Documentación del trabajo

`docs/estrategia-pruebas.md`, `docs/arquitectura.md` (con diagrama Mermaid), `docs/referencias.md`.
