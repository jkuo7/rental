import { Router } from "express";
import { nanoid } from "nanoid";
import items from "./itemsDb.js";
import rentals from "./rentalsDb.js";

const router = Router();

function getAllItems() {
  return Object.values(items);
}

function isIdUsedByItem(itemId) {
  return itemId in items;
}

function getItemById(itemId) {
  return items[itemId];
}

function getAllRentals() {
  return Object.values(rentals);
}

function isIdUsedByRental(rentalId) {
  return rentalId in rentals;
}

function getRentalById(rentalId) {
  return rentals[rentalId];
}

function expandRentalsInItems(itemsToExpand) {
  return itemsToExpand.map((item) => {
    return expandRentalsInItem(item);
  });
}

function expandRentalsInItem(itemToExpand) {
  return {
    ...itemToExpand,
    rentals: itemToExpand.rentals.map((rentalId) => getRentalById(rentalId)),
  };
}

// Retrieve a list of items, possibly filtered
router.get("/items", (req, res) => {
  const allowedQueriesAsFunctions = {
    name: (item, queryName) => {
      return item.name === queryName;
    },
    price: (item, queryPrice) => {
      return item.pricePerDay === queryPrice;
    },
    priceGT: (item, queryPrice) => {
      return item.pricePerDay > queryPrice;
    },
    priceLT: (item, queryPrice) => {
      return item.pricePerDay < queryPrice;
    },
    priceGTE: (item, queryPrice) => {
      return item.pricePerDay >= queryPrice;
    },
    priceLTE: (item, queryPrice) => {
      return item.pricePerDay <= queryPrice;
    },
  };

  const filters = req.query;
  for (const key in filters) {
    if (key in allowedQueriesAsFunctions === false) {
      delete filters[key];
    } else if (key !== "name") {
      filters[key] = Number(filters[key]);
      if (isNaN(filters[key])) {
        return res.status(400).json({ message: "Prices must be numbers" });
      }
    }
  }

  const filteredItems = getAllItems().filter((item) => {
    for (const key in filters) {
      if (!allowedQueriesAsFunctions[key](item, filters[key])) {
        return false;
      }
    }
    return true;
  });
  res.json(expandRentalsInItems(filteredItems));
});

// Retrieve a specific item by id
router.get("/items/:itemId/", (req, res) => {
  const { itemId } = req.params;

  if (!isIdUsedByItem(itemId)) {
    return res.status(404).json({ message: "Item not found" });
  }
  res.json(expandRentalsInItem(getItemById(itemId)));
});

// List a new item
router.post("/items", (req, res) => {
  const { name, description = "", pricePerDay } = req.body;

  if (!name || !pricePerDay) {
    return res
      .status(400)
      .json({ message: "Name and price per day are required" });
  }
  const numericPricePerDay = Number(pricePerDay);
  if (isNaN(numericPricePerDay)) {
    return res.status(400).json({ message: "Price per day must be a number" });
  }

  const itemId = nanoid();
  const newItem = {
    itemId,
    name,
    description,
    pricePerDay,
    rentals: [],
  };

  items[itemId] = newItem;

  res.status(201).json(newItem);
});

//Rent an item for a specific date range
router.post("/items/:itemId/rentals", (req, res) => {
  const { itemId } = req.params;
  const { startDate: startDateString, endDate: endDateString } = req.body;
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (isNaN(startDate) || isNaN(endDate)) {
    return res.status(400).json({ message: "Not a valid date" });
  }
  if (startDate >= endDate) {
    return res
      .status(400)
      .json({ message: "Start date must be earlier than end date" });
  }
  if (!isIdUsedByItem(itemId)) {
    return res.status(404).json({ message: "Item not found" });
  }
  const requestedItem = getItemById(itemId);

  function getInsertionIndex() {
    let left = 0;
    let right = requestedItem.rentals.length;
    while (left < right) {
      let middle = Math.floor((left + right) / 2);
      if (getRentalById(requestedItem.rentals[middle]).startDate < startDate) {
        left = middle + 1;
      } else {
        right = middle;
      }
    }
    return left;
  }

  function isDateRangeAvailable(insertionIndex) {
    if (
      insertionIndex &&
      getRentalById(requestedItem.rentals[insertionIndex - 1]).endDate >
        startDate
    ) {
      return false;
    }

    if (
      insertionIndex < requestedItem.rentals.length &&
      getRentalById(requestedItem.rentals[insertionIndex]).startDate < endDate
    ) {
      return false;
    }

    return true;
  }

  function makeRental() {
    const rentalId = nanoid();

    const newRental = {
      rentalId,
      startDate,
      endDate,
      itemId,
    };
    rentals[rentalId] = newRental;
    return newRental;
  }

  const insertionIndex = getInsertionIndex();
  if (isDateRangeAvailable(insertionIndex)) {
    const newRental = makeRental();
    requestedItem.rentals.splice(insertionIndex, 0, newRental.rentalId);
    return res.status(201).json(newRental);
  } else {
    return res
      .status(400)
      .json({ message: "Item not available during those dates" });
  }
});

//Return an item rental
router.delete("/rentals/:rentalId", (req, res) => {
  const { rentalId } = req.params;
  if (!isIdUsedByRental(rentalId)) {
    return res.status(404).json({ message: "Rental not found" });
  }

  const rentedItem = getItemById(getRentalById(rentalId).itemId);
  const rentalIndex = rentedItem.rentals.indexOf(rentalId);
  if (rentalIndex != -1) {
    rentedItem.rentals.splice(rentalIndex, 1);
  }
  delete rentals[rentalId];
  res.status(204).end();
});

export default router;
