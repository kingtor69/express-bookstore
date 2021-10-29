process.env.NODE_ENV = "test";

const db = require('../db');
const app = require('../app');
const request = require("supertest");

const powerUp = {
    "isbn": "0691161518",
    "amazon_url": "http://a.co/eobPtX2",
    "author": "Matthew Lane",
    "language": "english",
    "pages": 264,
    "publisher": "Princeton University Press",
    "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
    "year": 2017
};

const garp = {
    "isbn": "1524744794",
    "amazon_url": "https://www.amazon.com/World-According-Garp-Novel/dp/1524744794",
    "author": "John Irving",
    "language": "english",
    "pages": 544,
    "publisher": "Dutton",
    "title": "The World According to Garp",
    "year": 2018
};

const badBook = {
    "isbn": 3141592653,
    "amazon_url": "amazon.com",
    "author": true,
    "language": "pig latin",
    "pages": "lots",
    "publisher": "me",
    "year": 2525
};

describe('Test GET routes', () => {
    beforeEach(async () => {
        for (let book of [ powerUp, garp ]) {
            const { isbn, amazon_url, author, language, pages, publisher, title, year } = book;
            await db.query (
                `INSERT INTO books
                (isbn, amazon_url, author, language, pages, publisher, title, year)
                VALUES ( $1, $2, $3, $4, $5, $6, $7, $8 )`,
                [ isbn, amazon_url, author, language, pages, publisher, title, year ]
            );
        };
    });

    test("GET all books", async () => {
        const results = await request(app).get('/books');
        const books = results.body.books;
        expect(results.statusCode).toBe(200);
        
        expect(books.length).toBe(2);
        expect(books).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ isbn: powerUp.isbn}),
                expect.objectContaining({ isbn: garp.isbn}),
                expect.objectContaining({ title: powerUp.title}),
                expect.objectContaining({ title: garp.title})
            ])
          );
    });

    test("GET a book", async () => {
        const result = await request(app).get(`/books/${garp.isbn}`);
        const book = result.body.book;
        expect(result.statusCode).toBe(200);
        expect(book.title).toBe(garp.title);
    });

    test("Try to GET a book without a valid ISBN", async () => {
        const result = await request(app).get(`/books/${badBook.isbn}`);
        expect(result.statusCode).toBe(404);
    });

    afterEach(async () => {
        await db.query (
            `DELETE FROM books`
        );
    });
});

describe("Test POST routes", () => {
    test("Add a new book to the database", async() => {
        const result = await request(app).post(`/books`).send(garp);
        const book = result.body.book;
        expect(result.statusCode).toBe(201);
        expect(book.title).toBe(garp.title);
    });

    test("Attempt to add bad data to the database should return errors", async() => {
        const result = await request(app).post(`/books`).send(badBook);
        expect(result.statusCode).toBe(400);
    })

    afterEach(async () => {
        await db.query (
            `DELETE FROM books`
        );
    });
});

describe("Test PUT route", () => {
    beforeEach(async() => {
        const { isbn, amazon_url, author, language, pages, publisher, title, year } = garp;
        await db.query (
            `INSERT INTO books
            (isbn, amazon_url, author, language, pages, publisher, title, year)
            VALUES ( $1, $2, $3, $4, $5, $6, $7, $8 )`,
            [ isbn, amazon_url, author, language, pages, publisher, title, year ]
        );
    });

    test("Update book information", async() => {
        const carpTitle = {title: "The World According to Carps"}
        const result = await request(app).put(`/books/${garp.isbn}`).send(carpTitle);
        expect(result.statusCode).toBe(200);
        expect(result.body.book).toEqual(
            expect.objectContaining(carpTitle),
            expect.objectContaining(garp.isbn),
            expect.objectContaining(garp.author)
        );
    });

    test("Update with no data should return book as it was", async () => {
        const result = await request(app).put(`/books/${garp.isbn}`).send({});
        expect(result.statusCode).toBe(200);
        expect(result.body.book).toEqual(garp);
    });

    test("Update with invalid key should return book as it was", async () => {
        const invalidKey = {banana: "yummy"};
        const result = await request(app).put(`/books/${garp.isbn}`).send(invalidKey);
        expect(result.statusCode).toBe(200);
        expect(result.body.book).toEqual(garp);
    });

    test("Update with incorrectly formatted values should return 400", async () => {
        const invalidKey = {year: "last"};
        const result = await request(app).put(`/books/${garp.isbn}`).send(invalidKey);
        expect(result.statusCode).toBe(400);
    });

    test("Update with bad year should return 400", async () => {
        const badYear = {year: -2020};
        const result = await request(app).put(`/books/${garp.isbn}`).send(badYear);
        expect(result.statusCode).toBe(400);
    });

    test("Update with zero or negative number of pages should return 400", async () => {
        const zeroPages = {pages: 0};
        const negPages = {pages: -128};
        const resultZero = await request(app).put(`/books/${garp.isbn}`).send(zeroPages);
        const resultNeg = await request(app).put(`/books/${garp.isbn}`).send(negPages);
        expect(resultZero.statusCode).toBe(400);
        expect(resultNeg.statusCode).toBe(400);
    })

    afterEach(async() => {
        await db.query (
            `DELETE FROM books`
        );
    });
})

afterAll(async () => {
    await db.end();
});