import express, { json } from "express";
import items from "./routes/items.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", items);

app.listen(port, () => {
  console.log(`Rental items app listening on port ${port}`);
});

export default app;
