# TP: Book Reading tracker

- Create an HTML file where we have a form that register new books (use tailwindCSS to style it)
- Each book have a title(string), author(string), number of pages(number), status(String Enum), price (number), number of
pages read (number < number of pages), format(String Enum), suggested by(string), finished(boolean).
- Status can have one of the following values: Read, Re-read, DNF, Currently reading, Returned Unread, Want to read
- Format can have one of the following values: Print, PDF, Ebook, AudioBook
- Be default finished is equal to 0, the finished value will change to 1 automatically when number of pages read is euqal to
number of pages
- Create a class book have the following methods: a constructor, currentlyAt, deleteBook
- The book class should be its own module.
- Create a web page where we can track our reading by listing books and showing the percentage of reading for each book,
and a global section where you can see the total amount of book read and the amount of pages
- The books are stored in MongoDB