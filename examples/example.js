// Designed to be run from Node.js - i.e. "node example.js"
// (run `yarn build` first so the "xmldoc" package resolves to ./dist).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { XmlDocument } from "xmldoc";

// Demonstrate parsing an in-memory XML string
const xmlString =
  '<suggestions><book title="Twilight"/><book title="Twister"/></suggestions>';

const suggestions = new XmlDocument(xmlString);

// Demonstrate how toString() will pretty-print the XML for debugging
console.log("Parsed: \n%s", suggestions);

// Demonstrate a simple eachChild() loop, printing our book titles
suggestions.eachChild(function (book) {
  console.log("Found book with title: '%s'", book.attr.title);
  console.log(
    "==> The <book> tag started at position %s and the complete element ended at line %s, column %s, position %s.",
    book.startTagPosition,
    book.line,
    book.column,
    book.position,
  );
});

// Demonstrate firstChild/lastChild. Note these return the literal first/last
// child *nodes*, which include text nodes - so they're most useful on compact
// XML like this with no whitespace between elements.
console.log(
  "First book is '%s', last book is '%s'",
  suggestions.firstChild.attr.title,
  suggestions.lastChild.attr.title,
);

// Now load an XML file from disk and parse it
const data = readFileSync(join(import.meta.dirname, "test.xml"), "utf8");

const results = new XmlDocument(data);

// Demonstrate toString() with an option to abbreviate long strings and compress the output
console.log(
  "Parsed: \n%s",
  results.toString({ trimmed: true, compressed: true }),
);

// Pull out the <books> node
const books = results.childNamed("books");

// Print out the ISBNs
books.eachChild(function (book) {
  console.log("Found book with ISBN '%s'", book.attr.isbn);
});

// Look for all children with a certain node name
const allBooks = books.childrenNamed("book");

// The result is an array of <book> XmlElement instances
console.log("Found %s books.", allBooks.length);

// This indented XML keeps whitespace text nodes between elements, so we use
// childrenNamed() rather than firstChild/lastChild to get the <book> elements.
console.log(
  "First book has ISBN '%s', last book has ISBN '%s'",
  allBooks[0].attr.isbn,
  allBooks.at(-1).attr.isbn,
);

// Search for a particular book
const twilight = books.childWithAttribute("isbn", "478-2-23-765712-2");

// Result is a single XmlElement instance for <book>
console.log(
  "Title of book with given ISBN: '%s'",
  twilight.valueWithPath("title"),
);
