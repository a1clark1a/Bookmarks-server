const { NODE_ENV } = require("./config");
const logger = require("./logger");

function erroHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: `"server error 1"` } };
  } else {
    console.error(error);
    logger.error(error.message);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
}

module.exports = erroHandler;
