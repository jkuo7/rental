import { createAPI } from "./routes/api.js";

const app = createAPI();
const port = 3000;

app.listen(port, () => {
  console.log(`Rental items app listening on port ${port}`);
});
