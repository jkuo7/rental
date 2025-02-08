import { use, expect } from "chai";
import chaiHttp from "chai-http";
import { createAPI } from "../routes/api.js";

const chai = use(chaiHttp);

describe("Test retrieve items", () => {
  it("Retreive all items", function (done) {
    chai.request
      .execute(createAPI())
      .get("/items/")
      .end((err, res) => {
        expect(res).to.have.property("body");
        expect(res.body).to.have.lengthOf(2);
        done();
      });
  });
  it("Retreive items with name", function (done) {
    chai.request
      .execute(createAPI())
      .get("/items/")
      .query({ name: "hammer" })
      .end((err, res) => {
        expect(res).to.have.property("body");
        expect(res.body).to.have.lengthOf(1);
        done();
      });
  });
  it("Retreive items in price range", function (done) {
    chai.request
      .execute(createAPI())
      .get("/items/")
      .query({ priceGT: 20, priceLTE: 25 })
      .end((err, res) => {
        expect(res).to.have.property("body");
        expect(res.body).to.have.lengthOf(1);
        done();
      });
  });
});

describe("Test retrieve item by id", () => {
  it("Retreive non-existent item", function (done) {
    chai.request
      .execute(createAPI())
      .get("/items/15")
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res).to.have.property("body");
        expect(res.body).to.have.property("message").equal("Item not found");
        done();
      });
  });
  it("Retreive existing item", function (done) {
    const expectedItem = {
      itemId: "1",
      name: "hammer",
      description: "hits the nail on the head",
      pricePerDay: 30,
    };

    chai.request
      .execute(createAPI())
      .get("/items/1")
      .end((err, res) => {
        expect(res).to.have.property("body");
        for (const property in expectedItem) {
          expect(res.body)
            .to.have.property(property)
            .equal(expectedItem[property]);
        }
        done();
      });
  });
});

describe("Test list a new item", () => {
  it("Add an item with no name", function (done) {
    const newItem = {
      name: "",
      description: "hits the nail on the head",
      pricePerDay: 30,
    };

    chai.request
      .execute(createAPI())
      .post("/items")
      .set("Content-Type", "application/json")
      .send(newItem)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.have.property("body");
        expect(res.body)
          .to.have.property("message")
          .equal("Name and price per day are required");
        done();
      });
  });

  it("Add an item with non-numeric price", function (done) {
    const newItem = {
      name: "hammer",
      description: "hits the nail on the head",
      pricePerDay: "thirty",
    };

    chai.request
      .execute(createAPI())
      .post("/items")
      .set("Content-Type", "application/json")
      .send(newItem)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.have.property("body");
        expect(res.body)
          .to.have.property("message")
          .equal("Price per day must be a number");
        done();
      });
  });

  it("Add an item", function (done) {
    const newItem = {
      name: "hammer",
      description: "hits the nail on the head",
      pricePerDay: 30,
    };

    chai.request
      .execute(createAPI())
      .post("/items")
      .set("Content-Type", "application/json")
      .send(newItem)
      .end((err, res) => {
        expect(res).to.have.property("body");
        expect(res.body).to.have.property("name").equal(newItem.name);
        expect(res.body)
          .to.have.property("description")
          .equal(newItem.description);
        expect(res.body)
          .to.have.property("pricePerDay")
          .equal(newItem.pricePerDay);
        expect(res.body).to.have.property("itemId");
        expect(res.body).to.have.property("rentals").to.be.empty;
        done();
      });
  });
});

describe("Test rent an item", () => {
  it("Rent an item with not a date", function (done) {
    const rentalDates = {
      startDate: "2025-01-14",
      endDate: "next year",
    };

    chai.request
      .execute(createAPI())
      .post("/items/1/rentals")
      .set("Content-Type", "application/json")
      .send(rentalDates)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.have.property("body");
        expect(res.body).to.have.property("message").equal("Not a valid date");
        done();
      });
  });

  it("Rent an item with earlier end date", function (done) {
    const rentalDates = {
      startDate: "2025-01-14",
      endDate: "2024-01-17",
    };

    chai.request
      .execute(createAPI())
      .post("/items/1/rentals")
      .set("Content-Type", "application/json")
      .send(rentalDates)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.have.property("body");
        expect(res.body)
          .to.have.property("message")
          .equal("Start date must be earlier than end date");
        done();
      });
  });

  it("Rent an item with conflicting date", function (done) {
    const rentalDates = {
      startDate: "2025-01-14",
      endDate: "2025-02-16",
    };

    chai.request
      .execute(createAPI())
      .post("/items/1/rentals")
      .set("Content-Type", "application/json")
      .send(rentalDates)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.have.property("body");
        expect(res.body)
          .to.have.property("message")
          .equal("Item not available during those dates");
        done();
      });
  });

  it("Rent an item", function (done) {
    const rentalDates = {
      startDate: "2025-01-14",
      endDate: "2025-01-17",
    };

    chai.request
      .execute(createAPI())
      .post("/items/1/rentals")
      .set("Content-Type", "application/json")
      .send(rentalDates)
      .end((err, res) => {
        expect(res).to.have.property("body");
        expect(res.body)
          .to.have.property("startDate")
          .equal(new Date(rentalDates.startDate).toISOString());
        expect(res.body)
          .to.have.property("endDate")
          .equal(new Date(rentalDates.endDate).toISOString());
        expect(res.body).to.have.property("rentalId");
        expect(res.body).to.have.property("itemId").equal("1");
        done();
      });
  });
});

describe("Test return a rental", () => {
  it("Return non-existent rental", function (done) {
    chai.request
      .execute(createAPI())
      .delete("/rentals/15")
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res).to.have.property("body");
        expect(res.body).to.have.property("message").equal("Rental not found");
        done();
      });
  });

  it("Return an item", function (done) {
    chai.request
      .execute(createAPI())
      .delete("/rentals/1")
      .end((err, res) => {
        expect(res).to.have.status(204);
        done();
      });
  });
});
