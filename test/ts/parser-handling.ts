import { describe, test, expect } from "vitest";
import XmlDocument from "../../dist/xmldoc";

describe("Parser Handling", () => {
  test("Position information properties exist", () => {
    const xmlString = `
<root>
  <child id="1">
    <grandchild>value</grandchild>
  </child>
</root>`;

    const doc = new XmlDocument(xmlString);

    // Test that position information is available
    const child = doc.childNamed("child");
    expect(child).toBeDefined();

    // These properties should at least exist
    expect(child).toHaveProperty("line");
    expect(child).toHaveProperty("column");
    expect(child).toHaveProperty("position");
    expect(child).toHaveProperty("startTagPosition");

    // The parser property should be removed after parsing
    expect(child?.parser).toBeUndefined();

    // Check nested element
    const grandchild = child?.childNamed("grandchild");
    expect(grandchild).toBeDefined();
    expect(grandchild).toHaveProperty("line");
    expect(grandchild).toHaveProperty("column");
    expect(grandchild).toHaveProperty("position");
    expect(grandchild).toHaveProperty("startTagPosition");

    // The parser property should be removed after parsing
    expect(grandchild?.parser).toBeUndefined();
  });

  test("Parser property is properly cleaned up", () => {
    const xmlString = `<root><child><grandchild /></child></root>`;
    const doc = new XmlDocument(xmlString);

    // After parsing is complete, all parser references should be removed
    const checkNoParser = (element: any) => {
      expect(element.parser).toBeUndefined();

      if (element.children) {
        element.children.forEach((child: any) => {
          if (child.type === "element") {
            checkNoParser(child);
          }
        });
      }
    };

    checkNoParser(doc);
  });

  test("Position information is logged for XML elements", () => {
    // Create a simple XML structure to test
    const xmlString = "<root><level1><level2 /></level1></root>";

    const doc = new XmlDocument(xmlString);

    // Navigate to elements
    const level1 = doc.childNamed("level1");
    expect(level1).toBeDefined();

    const level2 = level1?.childNamed("level2");
    expect(level2).toBeDefined();

    // These properties should at least exist
    expect(level1).toHaveProperty("line");
    expect(level1).toHaveProperty("column");
    expect(level1).toHaveProperty("position");
    expect(level1).toHaveProperty("startTagPosition");

    expect(level2).toHaveProperty("line");
    expect(level2).toHaveProperty("column");
    expect(level2).toHaveProperty("position");
    expect(level2).toHaveProperty("startTagPosition");

    // The parser property should be removed after parsing
    expect(level1?.parser).toBeUndefined();
    expect(level2?.parser).toBeUndefined();
  });
});
