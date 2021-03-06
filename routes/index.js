var express = require('express');
var router = express.Router();
const Op = require('sequelize').Op;
const Book = require('../models').Book;

let searchHistory = '';

// Async handler so we don't need to repeat Try/Catch
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      // Forward error to the global error handler
      next(error);
    }
  }
}

/* GET home page. */
router.get('/', asyncHandler(async (req, res) => {
  res.redirect('/books');
}));

/* GET full list of books. */
router.get('/books', asyncHandler(async (req, res) => {
  // Limit of 10 books per page
  const limit = 10;
  // Get page variable from URL
  let page = parseInt(req.query.page);
  // If there is no page variable then set it to '0' by default
  if (!page) { page = 0; }
  const { count, rows } = await Book.findAndCountAll({
    offset: page * limit,
    limit: limit,
    where: {
      [Op.or]: [
        { title: {[Op.like]: `%${searchHistory}%`}},
        { author: {[Op.like]: `%${searchHistory}%`}},
        { genre: {[Op.like]: `%${searchHistory}%`}},
        { year: {[Op.like]: `%${searchHistory}%`}}
      ]
    }
  });
  // Pagination: The total amount of books divided by the page limit
  const pagination = count / limit;
  // If a page number is entered in the URL that is higher than
  // pagination then redirect to the index page
  if (pagination >= page) {
    res.render('index', { books: rows , title: "Books", pagination, count } );
  } else {
    res.redirect('/books');
  }
}));

/* POST Set searchHistory value and redirect to books */
router.post('/books', asyncHandler(async (req, res) => {
  if (req.body.search) {
    searchHistory = req.body.search;
  } else {
    // If search is empty or Reset button is pressed
    searchHistory = '';
  }
  res.redirect('/books');
}));

/* GET Create new book form. */
router.get('/books/new', asyncHandler(async (req, res) => {
  // Render the page with empty field values
  res.render('new-book', { book: {
                            title: "",
                            author: "",
                            genre: "",
                            year: ""
                          },
                          title: "New Book" });
}));

/* POST Add new book to database. */
router.post('/books/new', asyncHandler(async (req, res) => {
  let book;
  try {
    // Create new book entry in database
    const book = await Book.create(req.body);
    res.redirect("/books");
  } catch (error) {
    if(error.name === "SequelizeValidationError") { // checking the error
      // Save book build and repopulate form field values
      book = await Book.build(req.body);
      res.render("new-book", { book, errors: error.errors, title: "New Book" });
    } else {
      throw error; // error caught in the asyncHandler's catch block
    }
  }
}));

/* GET Show the book detail form. */
router.get('/books/:id', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    res.render('update-book', { book, title: book.title });
  } else {
    const err = new Error();
    err.status = 404;
    err.message = "Oops! It seems the page could not be found...";
    next(err);
  }
}));

/* POST Updates book info in the database. */
router.post('/books/:id', asyncHandler(async (req, res, next) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if(book) {
      // Update selected book entry in the database
      await book.update(req.body);
      res.redirect("/books"); 
    } else {
      const err = new Error();
      err.status = 404;
      err.message = "Oops! It seems the page could not be found...";
      next(err);
    }
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      // Save book build and repopulate form field values
      book = await Book.build(req.body);
      book.id = req.params.id;
      res.render('update-book', { book, errors: error.errors, title: book.title })
    } else {
      throw error;
    }
  }
}));

/* POST Deletes a book from the database. */
router.post('/books/:id/delete', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    // Delete the selected book from the database
    await book.destroy();
    res.redirect("/books");
  } else {
    const err = new Error();
    err.status = 404;
    err.message = "Oops! It seems the page could not be found...";
    next(err);
  }
}));

module.exports = router;
