import { describe, test } from "node:test";
import assert from "node:assert";
import { XmlDocument } from "xmldoc";

// Basic XML parsing tests
describe("XmlDocument parsing", () => {
  test("parses valid XML", () => {
    const xmlString = "<hello>world</hello>";
    const parsed = new XmlDocument(xmlString);
    assert.notStrictEqual(parsed, undefined);
  });

  test("throws on empty input", () => {
    assert.throws(() => {
      // @ts-ignore - Testing empty input
      new XmlDocument();
    });
  });

  test("throws on whitespace input", () => {
    assert.throws(() => {
      new XmlDocument("  ");
    });
  });
});

// CDATA handling tests
describe("CDATA handling", () => {
  test("preserves CDATA content", () => {
    const xmlString = "<hello><![CDATA[<world>]]></hello>";
    const parsed = new XmlDocument(xmlString);
    assert.strictEqual(parsed.val, "<world>");
  });

  test("handles mixed content with CDATA", () => {
    const xmlString = "<hello>(<![CDATA[<world>]]>)</hello>";
    const parsed = new XmlDocument(xmlString);
    assert.strictEqual(parsed.val, "(<world>)");
  });
});

// Child node navigation tests
describe("Child navigation", () => {
  test("childNamed finds named children", () => {
    const xmlString = "<books><book/><good-book/></books>";
    const books = new XmlDocument(xmlString);

    const goodBook = books.childNamed("good-book");
    assert.strictEqual(goodBook?.name, "good-book");
    assert.strictEqual(goodBook?.position, 26);

    const badBook = books.childNamed("bad-book");
    assert.strictEqual(badBook, undefined);
  });

  test("childrenNamed finds all matching children", () => {
    const xmlString = "<books><book/><book/><other/></books>";
    const books = new XmlDocument(xmlString);

    const bookNodes = books.childrenNamed("book");
    assert.strictEqual(bookNodes.length, 2);
    assert.strictEqual(bookNodes[0].name, "book");
    assert.strictEqual(bookNodes[1].name, "book");
    assert.strictEqual(bookNodes[1].position, 21);
  });
});

// Descendant search tests
describe("Descendant search", () => {
  test("descendantsNamed finds all matching descendants", () => {
    const xmlString =
      "<library><section><books><book/><book/></books></section><book/></library>";
    const library = new XmlDocument(xmlString);

    const bookNodes = library.descendantsNamed("book");
    assert.strictEqual(bookNodes.length, 3);
    assert.strictEqual(bookNodes[1].position, 39);
  });

  test("descendantWithPath follows dot notation path", () => {
    const xmlString =
      '<library><section><books><book id="1"/></books></section></library>';
    const library = new XmlDocument(xmlString);

    const book = library.descendantWithPath("section.books.book");
    assert.notStrictEqual(book, undefined);
    assert.strictEqual(book?.attr.id, "1");

    const missing = library.descendantWithPath("section.missing.path");
    assert.strictEqual(missing, undefined);
  });

  test("valueWithPath retrieves values from paths", () => {
    const xmlString =
      '<library><section><book id="1">Harry Potter</book></section></library>';
    const library = new XmlDocument(xmlString);

    const bookValue = library.valueWithPath("section.book");
    assert.strictEqual(bookValue, "Harry Potter");

    const bookAttr = library.valueWithPath("section.book@id");
    assert.strictEqual(bookAttr, "1");
  });
});

// Output formatting tests
describe("String output", () => {
  test("toString formats XML properly", () => {
    const xmlString = '<hello name="world"><child>value</child></hello>';
    const doc = new XmlDocument(xmlString);

    // Test default output
    const output = doc.toString();
    assert.match(output, /<hello name="world">/);
    assert.match(output, /<child>value<\/child>/);

    // Test compressed output
    const compressed = doc.toString({ compressed: true });
    assert.doesNotMatch(compressed, /\n/);
  });

  test("handles HTML self-closing tags correctly", () => {
    const xmlString = "<div><br/><custom/></div>";
    const doc = new XmlDocument(xmlString);

    // Test HTML option
    const output = doc.toString({ html: true });
    assert.match(output, /<br\/>/);
    assert.match(output, /<custom><\/custom>/);
  });
});

// Error handling
describe("Error handling", () => {
  test("throws on malformed XML", () => {
    const xmlString = "<hello><unclosed-tag></hello>";

    assert.throws(() => {
      new XmlDocument(xmlString);
    });
  });
});
