const knex = require("knex");
const app = require("../src/app");
const { makeBookmarksArray } = require("./bookmarks.fixtures");

describe.only("Bookmarks endpoints", () => {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });

    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () => db("bookmarks_table").truncate());

  afterEach("cleanup", () => db("bookmarks_table").truncate());

  describe("Unauthorized Requests", () => {
    it(`should respond with a 401 Unauthorized request for GET /bookmarks`, () => {
      return supertest(app)
        .get("/bookmarks")
        .expect(401, { error: "Unauthorzied Request" });
    });

    it(`should respond with a 401 Unauthorized request for GET /bookmarks/:id`, () => {
      return supertest(app)
        .get(`/bookmarks/${2}`)
        .expect(401, { error: "Unauthorzied Request" });
    });
  });

  describe("GET /bookmarks", () => {
    context("Given no bookmarks", () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context("Given there are bookmarks in the database", () => {
      const bookmarksList = makeBookmarksArray();

      beforeEach("insert bookmarks to test DB", () => {
        return db.into("bookmarks_table").insert(bookmarksList);
      });

      it("responds with 200 and all of the bookmarks", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, bookmarksList);
      });
    });
  });

  describe("GET /bookmarks/:id", () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 whe bookmark doesn't exist`, () => {
        return supertest(app)
          .get(`/bookmarks/123`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark doesnt exist` }
          });
      });
    });

    context(`Given there are bookmarks in the database`, () => {
      const bookmarksList = makeBookmarksArray();

      beforeEach("insert bookmarks to test DB", () => {
        return db.into("bookmarks_table").insert(bookmarksList);
      });

      it("GET /bookmarks/:id responds with 200 and the specified bookmark", () => {
        const id = 2;
        const expectedBookmark = bookmarksList[id - 1];
        return supertest(app)
          .get(`bookmarks/${id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });
  });
});
