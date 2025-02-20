# Rental

A backend API for a platform where users can rent out items

Run the app with the following command:

```
npm start
```

The app can then be accessed from `http://localhost:3000/`.

The app accepts the following two `Content-Type` formats:

- `application/json`
- `application/x-www-form-urlencoded`

### Available API calls

**Retrieve a list of items, possibly filtered:**

```
GET /items
GET /items?[filters]
```

`[filters]` supports the following query parameters:

- `name=[name]` returns `item` such that `item.name = name`
- `price=[price]` returns `item` such that `item.pricePerDay = price`
- `priceGT=[price]` returns `item` such that `item.pricePerDay > price`
- `priceLT=[price]` returns `item` such that `item.pricePerDay < price`
- `priceGTE=[price]` returns `item` such that `item.pricePerDay >= price`
- `priceLTE=[price]` returns `item` such that `item.pricePerDay <= price`

**Retrieve a specific item by id**

```
GET /items/:itemId
```

**List a new item:**

```
POST /items
Content-Type: application/json
{
    "name": "hammer",
    "description": "hits the nail on the head",
    "pricePerDay": 30
    ...
}
```

**Rent an item for a specific date range:**

```
POST /items/:itemId/rentals
Content-Type: application/json
{
    "startDate": '2025-01-14',
    "endDate": '2025-01-17'
    ...
}
```

**Return an item rental:**

```
DELETE /rentals/:rentalId
```

### Notes

Assuming that users can reserve an item for specific dates ahead of time, I chose to represent items and rentals as separate entities with a one-to-many relation, where each rental contains a foreign key for the associated item.

When viewing an item, its rentals are expanded to show the whole rental entity, rather than only the rental keys.

### Unit Tests

Unit tests can be run with the following command:

```
npm test
```
