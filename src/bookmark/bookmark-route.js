const express = require("express");
const uuid = require("uuid/v4");
const logger = require("../logger");
const BookmarksService = require("./bookmarks_service");
const { bookmarks } = require("../bookmarkList");

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route("/bookmarks")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmark => {
        res.json(bookmark);
      })
      .catch(next);
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
  .get((req, res, next) => {
    const { id } = req.params;
    const knexInstance = req.app.get("db");
    BookmarksService.getById(knexInstance, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark doesnt exist` }
          });
        }
        return res.json(bookmark);
      })
      .catch(next);
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
