require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const bookmarkRouter = require("./bookmark/bookmark-route");
const validateBearerToken = require("./validateBearerToken");
const errorHandler = require("./errorHandler");

const app = express();

app.use(
  morgan(NODE_ENV === "production" ? "tiny" : "common", {
    skip: () => NODE_ENV === "test"
  })
);
app.use(helmet());
app.use(cors());

//API validator
app.use(validateBearerToken);

//ROUTER
app.use("/api/bookmarks", bookmarkRouter);

//Error Handler
app.use(errorHandler);

module.exports = app;
