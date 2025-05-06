import { describe, test, expect } from "vitest";
import XmlDocument, {
  XmlElement,
  XmlTextNode,
  XmlCDataNode,
  XmlCommentNode,
  XmlStringOptions,
} from "../../dist/xmldoc";

// Test TypeScript interfaces and types
describe("TypeScript Interfaces", () => {
  test("XmlStringOptions interface works correctly", () => {
    const doc = new XmlDocument("<root><child>text</child></root>");

    // Test each option
    const options: XmlStringOptions = {
      compressed: true,
      trimmed: true,
      preserveWhitespace: false,
      html: false,
    };

    // Should not throw errors
    const result = doc.toString(options);
    expect(result).toBeDefined();
  });

  test("Node type checking works properly", () => {
    const doc = new XmlDocument(
      "<root>text<![CDATA[data]]><!-- comment --></root>",
    );

    // Check that we can identify node types
    let textNodeFound = false;
    let cdataNodeFound = false;
    let commentNodeFound = false;

    for (const child of doc.children) {
      if (child.type === "text") {
        textNodeFound = true;
        expect(child instanceof XmlTextNode).toBe(true);
      } else if (child.type === "cdata") {
        cdataNodeFound = true;
        expect(child instanceof XmlCDataNode).toBe(true);
      } else if (child.type === "comment") {
        commentNodeFound = true;
        expect(child instanceof XmlCommentNode).toBe(true);
      }
    }

    expect(textNodeFound).toBe(true);
    expect(cdataNodeFound).toBe(true);
    expect(commentNodeFound).toBe(true);
  });
});

// Test TypeScript specific method usage
describe("TypeScript Method Usage", () => {
  test("Optional chaining with nullable methods works", () => {
    const doc = new XmlDocument("<root><child>text</child></root>");

    // Using optional chaining for potentially undefined results
    const foundChild = doc.childNamed("child");
    const missingChild = doc.childNamed("missing");

    // This should work with TypeScript's optional chaining
    expect(foundChild?.val).toBe("text");
    expect(missingChild?.val).toBeUndefined();
  });

  test("Proper types for node collections", () => {
    const doc = new XmlDocument(
      "<root><item>1</item><item>2</item><item>3</item></root>",
    );

    // Collection methods should return proper types
    const items = doc.childrenNamed("item");

    // Should be able to use array methods on the result
    const values = items.map((item) => item.val);
    expect(values).toEqual(["1", "2", "3"]);
  });
});

// Test TypeScript node creation
describe("Node Creation", () => {
  test("Can create elements with TypeScript interfaces", () => {
    const xmlString = "<root><child>value</child></root>";
    const doc = new XmlDocument(xmlString);

    // Access child as XmlElement type
    const childElement = doc.childNamed("child") as XmlElement;
    expect(childElement).toBeDefined();
    expect(childElement.name).toBe("child");
    expect(childElement.val).toBe("value");
  });
});
