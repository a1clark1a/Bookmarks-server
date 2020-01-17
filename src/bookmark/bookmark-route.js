const express = require("express");
const uuid = require("uuid/v4");
const logger = require("../logger");
const { bookmarks } = require("../bookmarkList");

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route("/bookmarks")
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;

    //validation
    if (!title) {
      logger.error("title is required");
      return res.status(400).send("title required");
    }

    if (!url) {
      logger.error("url is required");
      return res.status(400).send("url required");
    }

    if (!description) {
      logger.error("description is required");
      return res.status(400).send("description required");
    }

    if (!rating) {
      logger.error("rating is  required");
      return res.status(400).send("rating required");
    }

    if (isNaN(rating) || rating < 0 || rating > 5) {
      logger.error("Invalid data");
      return res
        .status(400)
        .send("Invalid data, rating must be a number and from 0-5");
    }

    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);
  });

bookmarkRouter
  .route("/bookmarks/:id")
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(bm => bm.id == id); //set bookmark var when found in bookmarks array

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(400).send("Bookmark not found");
    }

    return res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Card with id ${id} not found`);
      return res.status(404).send("Not found");
    }

    //Remove bookmark from array

    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} deleted`);
    res.status(204).end();
  });

module.exports = bookmarkRouter;
