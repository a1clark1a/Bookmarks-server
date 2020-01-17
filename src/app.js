require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const bookmarkRouter = require("./bookmark/bookmark-route");

const app = express();

const morganOption = NODE_ENV === "production" ? " tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

//API validator
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");

  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    return res.status(401).json({ error: "Unauthorzied Request" });
  }

  next();
});

//ROUTER
app.use(bookmarkRouter);

//Error Handler
app.use(function erroHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
