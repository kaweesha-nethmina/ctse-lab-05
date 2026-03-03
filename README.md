# SE4010 Microservices Lab (Docker + API Gateway)

Ports:
- Item Service: `8081`
- Order Service: `8082`
- Payment Service: `8083`
- API Gateway: `8080`

## MongoDB (Atlas) configuration

- Database name: `Lab05`
- Connection string example:

```text
mongodb+srv://<username>:<password>@myatlasclusteredu.dubkafb.mongodb.net/
```

### Configure environment variables

1. Copy `.env.example` to `.env`.
2. Put your real MongoDB Atlas connection string in `MONGODB_URI`.
3. Leave `MONGODB_DB=Lab05` (or change if you use another DB name and update compose accordingly).

Docker Compose will pass these values into all three services.

## Run (Docker Compose)

From the project root:

```bash
docker-compose build
docker-compose up
```

To run detached:

```bash
docker-compose up -d
```

Stop everything:

```bash
docker-compose down
```

## Test through the API Gateway (port 8080)

### Item Service
- `GET http://localhost:8080/items`
- `POST http://localhost:8080/items`

Body:

```json
{ "name": "Headphones" }
```

- `GET http://localhost:8080/items/1`

### Order Service
- `GET http://localhost:8080/orders`
- `POST http://localhost:8080/orders`

Body:

```json
{ "item": "Laptop", "quantity": 2, "customerId": "C001" }
```

- `GET http://localhost:8080/orders/1`

### Payment Service
- `GET http://localhost:8080/payments`
- `POST http://localhost:8080/payments/process`

Body:

```json
{ "orderId": 1, "amount": 1299.99, "method": "CARD" }
```

- `GET http://localhost:8080/payments/1`

## Notes
- All data is persisted in MongoDB Atlas (database `Lab05`).
- Services do not call each other directly; routing is done via the API Gateway.
