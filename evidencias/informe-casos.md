# Informe de ejecución de casos de prueba

Generado: 3/10/2026, 5:03:31 a. m.

**Resultado: 8 aprobados de 8 casos.**

| ID | Nombre | Tipo | Estado | Resultado obtenido |
|----|--------|------|--------|--------------------|
| CP-01 | Pedido exitoso | Integración | Aprobado | HTTP 201, estado CONFIRMADO, stock de P001 pasó de 10 a 8 |
| CP-02 | Cantidad inválida | Integración | Aprobado | HTTP 400 VALIDACION ("La cantidad debe ser mayor que 0"); Inventario recibió 0 reservas; stock sin cambios (10) |
| CP-03 | Producto inexistente | Integración | Aprobado | HTTP 404 PRODUCTO_NO_EXISTE propagado desde Inventario; no se creó ningún pedido |
| CP-04 | Stock insuficiente | Integración | Aprobado | HTTP 409 STOCK_INSUFICIENTE (disponible 3, solicitado 999); stock intacto; no se creó pedido |
| CP-05 | Inventario caído (falla técnica real) | Integración | Aprobado | HTTP 503 INVENTARIO_NO_DISPONIBLE ("Inventario no está disponible"); /health de Pedidos sigue en 200; no se creó pedido |
| CP-06 | Inventario lento (timeout) | Integración | Aprobado | HTTP 504 INVENTARIO_TIMEOUT en 2009 ms (timeout 2000 ms, Inventario tardaba 5000 ms) |
| CP-07 | Flujo completo de pedido | Sistema | Aprobado | Pedido #1 creado (201), consultable como CONFIRMADO (200) y stock de P002 pasó de 3 a 2 |
| CP-08 | Inventario responde error 500 | Integración | Aprobado | HTTP 502 INVENTARIO_RESPUESTA_INESPERADA; no se creó pedido |
