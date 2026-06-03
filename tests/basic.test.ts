import { describe, test } from "node:test";
import assert from "node:assert";
import { XmlDocument, XmlElement } from "xmldoc";

describe("Parsing", () => {
  test("parses valid XML", () => {
    const parsed = new XmlDocument("<hello>world</hello>");
    assert.notStrictEqual(parsed, undefined);
  });

  test("throws on empty input", () => {
    assert.throws(() => {
      // @ts-expect-error - testing missing input
      new XmlDocument();
    });
  });

  test("throws on whitespace-only input", () => {
    assert.throws(() => {
      new XmlDocument("  ");
    });
  });

  test("throws on malformed XML", () => {
    assert.throws(() => {
      new XmlDocument("<hello><unclosed-tag></hello>");
    });
  });
});

describe("CDATA handling", () => {
  test("preserves CDATA content", () => {
    const parsed = new XmlDocument("<hello><![CDATA[<world>]]></hello>");
    assert.strictEqual(parsed.val, "<world>");
  });

  test("handles mixed text and CDATA content", () => {
    const parsed = new XmlDocument("<hello>(<![CDATA[<world>]]>)</hello>");
    assert.strictEqual(parsed.val, "(<world>)");
  });
});

describe("Doctype handling", () => {
  test("captures the doctype", () => {
    const doc = new XmlDocument("<!DOCTYPE HelloWorld><hello>world</hello>");
    assert.strictEqual(doc.doctype, " HelloWorld");
  });

  test("doctype is empty when absent", () => {
    const doc = new XmlDocument("<hello>world</hello>");
    assert.strictEqual(doc.doctype, "");
  });

  test("throws on doctype inside an element", () => {
    assert.throws(() => {
      new XmlDocument("<hello><!DOCTYPE HelloWorld>world</hello>");
    });
  });
});

describe("Comment handling", () => {
  test("comment-only element has empty value", () => {
    const parsed = new XmlDocument("<hello><!-- World --></hello>");
    assert.strictEqual(parsed.val, "");
  });

  test("handles mixed text and comment content", () => {
    const parsed = new XmlDocument("<hello>(<!-- World -->)</hello>");
    assert.strictEqual(parsed.val, "()");
  });

  test("handles text, comment, and CDATA together", () => {
    const parsed = new XmlDocument(
      "<hello>Hello<!-- , --> <![CDATA[<world>]]>!</hello>",
    );
    assert.strictEqual(parsed.val, "Hello <world>!");
  });
});

describe("Text handling", () => {
  test("text alongside child elements", () => {
    const parsed = new XmlDocument("<hello>hello, <world/>!</hello>");
    assert.strictEqual(parsed.val, "hello, !");
  });

  test("text before root node", () => {
    const xml = new XmlDocument("\n\n<hello>*</hello>");
    assert.strictEqual(xml.val, "*");
    assert.strictEqual(xml.children.length, 1);
  });

  test("text after root node", () => {
    const xml = new XmlDocument("<hello>*</hello>\n\n");
    assert.strictEqual(xml.val, "*");
    assert.strictEqual(xml.children.length, 1);
  });

  test("text before root node with version", () => {
    const xml = new XmlDocument('<?xml version="1.0"?>\n\n<hello>*</hello>');
    assert.strictEqual(xml.val, "*");
    assert.strictEqual(xml.children.length, 1);
  });

  test("text after root node with version", () => {
    const xml = new XmlDocument('<?xml version="1.0"?><hello>*</hello>\n\n');
    assert.strictEqual(xml.val, "*");
    assert.strictEqual(xml.children.length, 1);
  });

  test("comment before root node", () => {
    const xml = new XmlDocument("<!-- hello --><world>*</world>");
    assert.strictEqual(xml.val, "*");
    assert.strictEqual(xml.children.length, 1);
  });

  test("comment after root node", () => {
    const xml = new XmlDocument("<hello>*</hello><!-- world -->");
    assert.strictEqual(xml.val, "*");
    assert.strictEqual(xml.children.length, 1);
  });
});

describe("Tag locations", () => {
  test("reports start tag position, line, column, and position", () => {
    const books = new XmlDocument('<books><book title="Twilight"/></books>');
    assert.strictEqual(books.children[0].type, "element");
    const book = books.children[0] as XmlElement;
    assert.strictEqual(book.attr.title, "Twilight");
    assert.strictEqual(book.startTagPosition, 8);
    assert.strictEqual(book.line, 0);
    assert.strictEqual(book.column, 31);
    assert.strictEqual(book.position, 31);
  });
});

describe("eachChild", () => {
  test("iterates over element children", () => {
    const books = new XmlDocument(
      '<books><book title="Twilight"/><book title="Twister"/></books>',
    );
    const expectedTitles = ["Twilight", "Twister"];

    books.eachChild((book, i) => {
      assert.strictEqual(book.attr.title, expectedTitles[i]);
    });

    let called = 0;
    books.eachChild(() => {
      called++;
      return false; // returning false short-circuits the loop
    });
    assert.strictEqual(called, 1);
  });

  test("skips text and comment nodes", () => {
    const books = new XmlDocument(
      '<books><book title="Twilight"/>text!<book title="Twister"/><!--comment!--></books>',
    );
    const expectedTitles = ["Twilight", "Twister"];

    let elI = 0;
    books.eachChild((book) => {
      assert.strictEqual(book.attr.title, expectedTitles[elI++]);
    });

    let called = 0;
    books.eachChild(() => {
      called++;
      return false; // returning false short-circuits the loop
    });
    assert.strictEqual(called, 1);
  });
});

describe("Child navigation", () => {
  test("childNamed finds named children", () => {
    const books = new XmlDocument("<books><book/><good-book/></books>");
    assert.strictEqual(books.childNamed("good-book")?.name, "good-book");
    assert.strictEqual(books.childNamed("bad-book"), undefined);
  });

  test("childNamed skips intervening text nodes", () => {
    const books = new XmlDocument("<books><book/>text<good-book/></books>");
    assert.strictEqual(books.childNamed("good-book")?.name, "good-book");
    assert.strictEqual(books.childNamed("bad-book"), undefined);
  });

  test("childrenNamed finds all matching children", () => {
    const fruits = new XmlDocument(
      '<fruits><apple sweet="yes"/><orange/><apple sweet="no"/><banana/></fruits>',
    );
    const apples = fruits.childrenNamed("apple");
    assert.strictEqual(apples.length, 2);
    assert.strictEqual(apples[0].attr.sweet, "yes");
    assert.strictEqual(apples[1].attr.sweet, "no");
  });

  test("childWithAttribute finds child by attribute value", () => {
    const fruits = new XmlDocument(
      '<fruits><apple pick="no"/><orange rotten="yes"/><apple pick="yes"/><banana/></fruits>',
    );

    const picked = fruits.childWithAttribute("pick", "yes");
    assert.strictEqual(picked?.name, "apple");
    assert.strictEqual(picked?.attr.pick, "yes");

    const rotten = fruits.childWithAttribute("rotten");
    assert.strictEqual(rotten?.name, "orange");

    assert.strictEqual(fruits.childWithAttribute("peeled"), undefined);
  });

  test("childWithAttribute skips intervening text nodes", () => {
    const fruits = new XmlDocument(
      '<fruits><apple pick="no"/><orange rotten="yes"/>text<apple pick="yes"/><banana/></fruits>',
    );

    const picked = fruits.childWithAttribute("pick", "yes");
    assert.strictEqual(picked?.name, "apple");
    assert.strictEqual(picked?.attr.pick, "yes");

    const rotten = fruits.childWithAttribute("rotten");
    assert.strictEqual(rotten?.name, "orange");

    assert.strictEqual(fruits.childWithAttribute("peeled"), undefined);
  });
});

describe("Descendant search", () => {
  test("descendantsNamed finds all matching descendants", () => {
    const navigation = new XmlDocument(
      '<navigation><item id="1"/><divider/><item id="2"><item id="2.1"/><item id="2.2"><item id="2.2.1"/></item><divider/><item id="3"/></item></navigation>',
    );
    const items = navigation.descendantsNamed("item");
    assert.strictEqual(items.length, 6);
    assert.deepStrictEqual(
      items.map((i) => i.attr.id),
      ["1", "2", "2.1", "2.2", "2.2.1", "3"],
    );
  });

  test("descendantWithPath follows dot notation", () => {
    const book = new XmlDocument(
      "<book><author><first>George R.R.</first><last>Martin</last></author></book>",
    );
    assert.strictEqual(book.descendantWithPath("author.last")?.val, "Martin");
    assert.strictEqual(book.descendantWithPath("author.middle"), undefined);
    assert.strictEqual(book.descendantWithPath("publisher.first"), undefined);
  });

  test("descendantWithPath skips intervening text nodes", () => {
    const book = new XmlDocument(
      "<book><author>text<first>George R.R.</first><last>Martin</last></author></book>",
    );
    assert.strictEqual(book.descendantWithPath("author.last")?.val, "Martin");
    assert.strictEqual(book.descendantWithPath("author.middle"), undefined);
    assert.strictEqual(book.descendantWithPath("publisher.first"), undefined);
  });

  test("valueWithPath retrieves values and attributes", () => {
    const book = new XmlDocument(
      '<book><author><first>George R.R.</first><last hyphenated="no">Martin</last></author></book>',
    );
    assert.strictEqual(book.valueWithPath("author.last"), "Martin");
    assert.strictEqual(book.valueWithPath("author.last@hyphenated"), "no");
    assert.strictEqual(
      book.valueWithPath("publisher.last@hyphenated"),
      undefined,
    );
  });

  test("valueWithPath skips intervening text nodes", () => {
    const book = new XmlDocument(
      '<book><author>text<first>George R.R.</first><last hyphenated="no">Martin</last></author></book>',
    );
    assert.strictEqual(book.valueWithPath("author.last"), "Martin");
    assert.strictEqual(book.valueWithPath("author.last@hyphenated"), "no");
    assert.strictEqual(
      book.valueWithPath("publisher.last@hyphenated"),
      undefined,
    );
  });
});

describe("toString", () => {
  test("pretty-prints by default and compresses on request", () => {
    const doc = new XmlDocument('<books><book title="Twilight"/></books>');
    assert.strictEqual(
      doc.toString(),
      '<books>\n  <book title="Twilight"/>\n</books>',
    );
    assert.strictEqual(
      doc.toString({ compressed: true }),
      '<books><book title="Twilight"/></books>',
    );
  });

  test("trims whitespace unless preserveWhitespace is set", () => {
    const doc = new XmlDocument("<hello> world </hello>");
    assert.strictEqual(doc.toString(), "<hello>world</hello>");
    assert.strictEqual(
      doc.toString({ preserveWhitespace: true }),
      "<hello> world </hello>",
    );
  });

  test("round-trips CDATA", () => {
    const doc = new XmlDocument("<hello><![CDATA[<world>]]></hello>");
    assert.strictEqual(doc.toString(), "<hello><![CDATA[<world>]]></hello>");
  });

  test("preserves whitespace across mixed content", () => {
    const doc = new XmlDocument(
      "<hello>Hello<!-- , --> <![CDATA[<world>]]>!</hello>",
    );
    assert.strictEqual(
      doc.toString({ preserveWhitespace: true }),
      "<hello>\n  Hello\n  <!-- , -->\n   \n  <![CDATA[<world>]]>\n  !\n</hello>",
    );
  });

  test("formats text mixed with elements", () => {
    const doc = new XmlDocument("<hello>hello, <world/>!</hello>");
    assert.strictEqual(
      doc.toString(),
      "<hello>\n  hello,\n  <world/>\n  !\n</hello>",
    );
  });

  test("trimmed option abbreviates long values", () => {
    const xmlString =
      "<hello>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et accumsan nisi.</hello>";
    const doc = new XmlDocument(xmlString);
    assert.strictEqual(doc.toString(), xmlString);
    assert.strictEqual(
      doc.toString({ trimmed: true }),
      "<hello>Lorem ipsum dolor sit ame…</hello>",
    );
  });

  test("compresses output with child elements", () => {
    const xmlString = "<hello>world<earth/><moon/></hello>";
    const doc = new XmlDocument(xmlString);
    assert.strictEqual(doc.toString({ compressed: true }), xmlString);
  });

  test("html option uses self-closing rules", () => {
    const doc = new XmlDocument("<div><br/><custom/></div>");
    const output = doc.toString({ html: true });
    assert.match(output, /<br\/>/);
    assert.match(output, /<custom><\/custom>/);
  });

  test("is not confused by Object.prototype extensions", () => {
    try {
      // adding to Object.prototype must not leak into attribute exporting
      (Object.prototype as Record<string, unknown>).cruftyExtension =
        "You don't want this string to be exported!";

      const doc = new XmlDocument('<books><book title="Twilight"/></books>');
      assert.strictEqual(
        doc.toString(),
        '<books>\n  <book title="Twilight"/>\n</books>',
      );
    } finally {
      delete (Object.prototype as Record<string, unknown>).cruftyExtension;
    }
  });
});
