import express from "express";
import items from "./items.js";

export function createAPI() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/", items);
  return app;
}
