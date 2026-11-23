# notifications-service

Envía correos locales de confirmación mediante SMTP y Mailpit. No tiene base de datos y una caída del servicio nunca invalida una compra pagada.

## Flujo

1. Recibe `orderId` y `customerId` desde `orders-service`.
2. Consulta nombre y correo en `auth-service` mediante una ruta interna.
3. Consulta las entradas emitidas en `tickets-service`.
4. Comprueba que todas pertenezcan al cliente.
5. Descarga el PDF de cada entrada y lo adjunta como `entrada-<ticketId>.pdf`.
6. Genera un correo HTML y texto con un enlace por entrada.
7. Entrega el mensaje al servidor SMTP local.

Si falta el PDF de alguna entrada, el correo no se envía y el fallo se registra. La compra ya pagada no se invalida.

Los logs contienen solamente `orderId`. No se registran contenido del correo, JWT, contraseñas ni datos de tarjeta.

## Endpoints

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/internal/notifications/purchase-confirmation` | Enviar confirmación de compra |
| `GET` | `/health/live` | Estado del proceso |
| `GET` | `/health/ready` | Disponibilidad del servidor SMTP |

La ruta interna requiere `X-Internal-Api-Key` y el servicio escucha solamente en `127.0.0.1`.

## Mailpit

Configuración esperada:

```dotenv
SMTP_HOST=localhost
SMTP_PORT=1025
MAIL_FROM=no-reply@entradasya.local
WEB_URL=http://localhost:5173
```

Mailpit se ejecuta con Docker Compose desde la raíz del repositorio:

```bash
pnpm mailpit:up     # inicia Mailpit en segundo plano
pnpm mailpit:logs   # sigue los logs
pnpm mailpit:down   # detiene el contenedor
```

La bandeja web queda disponible en `http://localhost:8025`. Los mensajes se guardan en `mailpit-data/` (raíz del proyecto) y persisten entre reinicios.

## Desarrollo

```bash
pnpm --filter notifications-service dev
pnpm --filter notifications-service test
pnpm --filter notifications-service test:e2e
pnpm --filter notifications-service build
```
