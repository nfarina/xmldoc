var XmlDocument = require('../').XmlDocument
var t = require('tap')

t.test('parse in-memory string', function (t) {
  
  var xmlString = '<hello>world</hello>';
  var parsed = new XmlDocument(xmlString);
  t.ok(parsed);
  t.end();
})

t.test('eachChild', function (t) {
  
  var xmlString = '<books><book title="Twilight"/><book title="Twister"/></books>';
  var books = new XmlDocument(xmlString);
  
  expectedTitles = ["Twilight", "Twister"];
  
  books.eachChild(function(book, i, books) {
    t.equal(book.attr.title, expectedTitles[i]);
  });
  
  t.end();
})

t.test('tag locations', function (t) {
  
  var xmlString = '<books><book title="Twilight"/></books>';
  var books = new XmlDocument(xmlString);
  
  var book = books.children[0];
  t.equal(book.attr.title, "Twilight");
  t.equal(book.startTagPosition, 8);
  t.equal(book.line, 0);
  t.equal(book.column, 31);
  t.equal(book.position, 31);
  t.end();
})
