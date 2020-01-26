const knex = require("knex");
const app = require("../src/app");
const {
  makeBookmarksArray,
  makeMaliciousBookmark
} = require("./bookmarks.fixtures");

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

    context("Given an XSS attack bookmark", () => {
      const {
        maliciousBookmark,
        expectedMaliciousBookmark
      } = makeMaliciousBookmark();

      beforeEach("insert malicious bookmark", () => {
        return db.into("bookmarks_table").insert([maliciousBookmark]);
      });

      it("removes XSS attack scripts", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedMaliciousBookmark.title);
            expect(res.body[0].description).to.eql(
              expectedMaliciousBookmark.description
            );
          });
      });
    });
  });

  describe("GET /bookmarks/:id", () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404`, () => {
        return supertest(app)
          .get(`/bookmarks/532`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not found` }
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
          .get(`/bookmarks/${id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });

    context(`Given an XSS attack bookmark`, () => {
      const {
        maliciousBookmark,
        expectedMaliciousBookmark
      } = makeMaliciousBookmark();

      beforeEach("insert malicious bookmark", () => {
        return db.into("bookmarks_table").insert([maliciousBookmark]);
      });

      it("removes XSS attack script", () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedMaliciousBookmark.title);
            expect(res.body.description).to.eql(
              expectedMaliciousBookmark.description
            );
          });
      });
    });
  });

  describe(`POST /bookmarks`, () => {
    context("Clean post", () => {
      it(`creates a bookmark responding with a 201 and the new bookmark`, () => {
        const newBookmark = {
          title: "The new bookmark",
          url: "https://www.thinkful.com",
          description: "Thinkful website",
          rating: 5
        };

        return supertest(app)
          .post("/bookmarks")
          .send(newBookmark)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.description).to.eql(newBookmark.description);
            expect(res.body.rating).to.eql(newBookmark.rating);
            expect(res.body).to.have.property("id");
            expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
          })
          .then(postRes =>
            supertest(app)
              .get(`/bookmarks/${postRes.body.id}`)
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(postRes.body)
          );
      });

      const requiredFields = ["title", "url", "rating"];

      requiredFields.forEach(field => {
        const newBookmark = {
          title: "Test new bookmark",
          url: "https://www.thinkful.com",
          description: "some description",
          rating: 4
        };

        it(`responds with 400 and an error message when the '${field}' is missing`, () => {
          delete newBookmark[field];

          return supertest(app)
            .post("/bookmarks")
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .send(newBookmark)
            .expect(400, {
              error: { message: `Missing '${field}' in request body` }
            });
        });
      });

      const wrongRating = ["a string", 1234, 0, -1];

      wrongRating.forEach(value => {
        let testBookmark = {
          title: "Testing wrong data for rating",
          url: "https://www.thinkful.com",
          description: "test description",
          rating: value
        };

        it(`responds with a 400 and an error message when rating '${value}'is invalid data`, () => {
          return supertest(app)
            .post("/bookmarks")
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .send(testBookmark)
            .expect(400, {
              error: {
                message: `Invalid data, rating must be a number and from 0-5`
              }
            });
        });
      });
    });

    context(`Given an XSS attack bookmark`, () => {
      const {
        maliciousBookmark,
        expectedMaliciousBookmark
      } = makeMaliciousBookmark();

      it("removes XSS attack script", () => {
        return supertest(app)
          .post("/bookmarks")
          .send(maliciousBookmark)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(expectedMaliciousBookmark.title);
            expect(res.body.description).to.eql(
              expectedMaliciousBookmark.description
            );
          });
      });
    });
  });

  describe(`DELETE /bookmarks/:id`, () => {
    context(`Given no articles`, () => {
      it(`responds with 404`, () => {
        const wrongId = 123455;
        return supertest(app)
          .delete(`/bookmarks/${wrongId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: "Bookmark Not found" } });
      });
    });

    context(`Given there are bookmarks in the database`, () => {
      const testBookmark = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks_table").insert(testBookmark);
      });

      it("responds with 204 and removes the article", () => {
        const idToRemove = 2;
        const remainingBookmark = testBookmark.filter(
          bookmark => bookmark.id !== idToRemove
        );
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res => {
            supertest(app)
              .get("/bookmarks")
              .expect(remainingBookmark);
          });
      });
    });
  });
});
