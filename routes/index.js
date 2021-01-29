var express = require('express');
var router = express.Router();
const Book = require('../models').Book;

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
  const page = parseInt(req.query.page);
  const { count, rows } = await Book.findAndCountAll({
    offset: page * limit,
    limit: limit
  });
  // Pagination: The total amount of books divided by the page limit
  const pagination = count / limit;
  res.render('index', { books: rows , title: "Books", pagination } );
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
router.get('/books/:id', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    res.render('update-book', { book, title: book.title });
  } else {
    const err = new Error();
    err.status = 404;
    err.message = "Oops! It seems the page could not be found...";
    res.render('page-not-found', {err, title: "Page Not Found"});
  }
}));

/* POST Updates book info in the database. */
router.post('/books/:id', asyncHandler(async (req, res) => {
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
      res.render('page-not-found', {err, title: "Page Not Found"});
    }
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      // Save book build and repopulate form field values
      book = await Book.build(req.body);
      res.render('update-book', { book, errors: error.errors, title: book.title })
    } else {
      throw error;
    }
  }
}));

/* POST Deletes a book from the database. */
router.post('/books/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    // Delete the selected book from the database
    await book.destroy();
    res.redirect("/books");
  } else {
    const err = new Error();
    err.status = 404;
    err.message = "Oops! It seems the page could not be found...";
    res.render('page-not-found', {err, title: "Page Not Found"});
  }
}));

module.exports = router;
