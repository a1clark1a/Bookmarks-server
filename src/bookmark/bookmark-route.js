const express = require("express");
const uuid = require("uuid/v4");
const logger = require("../logger");
const BookmarksService = require("./bookmarks_service");
const xss = require("xss");
const { bookmarks } = require("../bookmarkList");

const bookmarkRouter = express.Router();
const bodyParser = express.json();

sanitizedBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: bookmark.rating
});

bookmarkRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(sanitizedBookmark));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const knexInstance = req.app.get("db");
    const newBookmark = { title, url, rating };

    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    if (isNaN(rating) || rating <= 0 || rating > 5) {
      logger.error("Invalid data");
      return res.status(400).json({
        error: { message: "Invalid data, rating must be a number and from 0-5" }
      });
    }

    const postNewBookmark = { title, url, description, rating };

    BookmarksService.insertBookmark(knexInstance, postNewBookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created`);
        res
          .status(201)
          .location(req.originalUrl + `/${bookmark.id}`)
          .json(sanitizedBookmark(bookmark));
      })
      .catch(next);
  });

bookmarkRouter
  .route("/:id")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { id } = req.params;
    BookmarksService.getById(knexInstance, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark Not found` }
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(sanitizedBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { id } = req.params;
    BookmarksService.deleteBookmark(knexInstance, id)
      .then(bookmark => {
        logger.info(`Bookmark with id ${id} deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = { title, url, description, rating };
    const knexInstance = req.app.get("db");
    const { id } = req.params;
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean)
      .length;
    if (numberOfValues < 3) {
      return res.status(400).json({
        error: {
          message: `Request body must have all required fields 'title', 'url' and 'rating'`
        }
      });
    }

    BookmarksService.updateBookmark(knexInstance, id, bookmarkToUpdate)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarkRouter;
