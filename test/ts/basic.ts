import { describe, test, expect } from "vitest";
import XmlDocument, { XmlElement } from "../../dist/xmldoc";

// Basic XML parsing tests
describe("XmlDocument parsing", () => {
  test("parses valid XML", () => {
    const xmlString = "<hello>world</hello>";
    const parsed = new XmlDocument(xmlString);
    expect(parsed).toBeDefined();
  });

  test("throws on empty input", () => {
    expect(() => {
      // @ts-ignore - Testing empty input
      new XmlDocument();
    }).toThrow();
  });

  test("throws on whitespace input", () => {
    expect(() => {
      new XmlDocument("  ");
    }).toThrow();
  });
});

// CDATA handling tests
describe("CDATA handling", () => {
  test("preserves CDATA content", () => {
    const xmlString = "<hello><![CDATA[<world>]]></hello>";
    const parsed = new XmlDocument(xmlString);
    expect(parsed.val).toBe("<world>");
  });

  test("handles mixed content with CDATA", () => {
    const xmlString = "<hello>(<![CDATA[<world>]]>)</hello>";
    const parsed = new XmlDocument(xmlString);
    expect(parsed.val).toBe("(<world>)");
  });
});

// Child node navigation tests
describe("Child navigation", () => {
  test("childNamed finds named children", () => {
    const xmlString = "<books><book/><good-book/></books>";
    const books = new XmlDocument(xmlString);

    const goodBook = books.childNamed("good-book");
    expect(goodBook?.name).toBe("good-book");

    const badBook = books.childNamed("bad-book");
    expect(badBook).toBeUndefined();
  });

  test("childrenNamed finds all matching children", () => {
    const xmlString = "<books><book/><book/><other/></books>";
    const books = new XmlDocument(xmlString);

    const bookNodes = books.childrenNamed("book");
    expect(bookNodes.length).toBe(2);
    expect(bookNodes[0].name).toBe("book");
    expect(bookNodes[1].name).toBe("book");
  });
});

// Descendant search tests
describe("Descendant search", () => {
  test("descendantsNamed finds all matching descendants", () => {
    const xmlString =
      "<library><section><books><book/><book/></books></section><book/></library>";
    const library = new XmlDocument(xmlString);

    const bookNodes = library.descendantsNamed("book");
    expect(bookNodes.length).toBe(3);
  });

  test("descendantWithPath follows dot notation path", () => {
    const xmlString =
      '<library><section><books><book id="1"/></books></section></library>';
    const library = new XmlDocument(xmlString);

    const book = library.descendantWithPath("section.books.book");
    expect(book).toBeDefined();
    expect(book?.attr.id).toBe("1");

    const missing = library.descendantWithPath("section.missing.path");
    expect(missing).toBeUndefined();
  });

  test("valueWithPath retrieves values from paths", () => {
    const xmlString =
      '<library><section><book id="1">Harry Potter</book></section></library>';
    const library = new XmlDocument(xmlString);

    const bookValue = library.valueWithPath("section.book");
    expect(bookValue).toBe("Harry Potter");

    const bookAttr = library.valueWithPath("section.book@id");
    expect(bookAttr).toBe("1");
  });
});

// Output formatting tests
describe("String output", () => {
  test("toString formats XML properly", () => {
    const xmlString = '<hello name="world"><child>value</child></hello>';
    const doc = new XmlDocument(xmlString);

    // Test default output
    const output = doc.toString();
    expect(output).toContain('<hello name="world">');
    expect(output).toContain("<child>value</child>");

    // Test compressed output
    const compressed = doc.toString({ compressed: true });
    expect(compressed).not.toContain("\n");
  });

  test("handles HTML self-closing tags correctly", () => {
    const xmlString = "<div><br/><custom/></div>";
    const doc = new XmlDocument(xmlString);

    // Test HTML option
    const output = doc.toString({ html: true });
    expect(output).toContain("<br/>");
    expect(output).toContain("<custom></custom>");
  });
});

// Error handling
describe("Error handling", () => {
  test("throws on malformed XML", () => {
    const xmlString = "<hello><unclosed-tag></hello>";

    expect(() => {
      new XmlDocument(xmlString);
    }).toThrow();
  });
});
