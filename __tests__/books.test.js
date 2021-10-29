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

    afterEach(async () => {
        await db.query (
            `DELETE FROM books`
        );
    });
});

afterAll(async () => {
    await db.end();
});