import { describe, test } from "node:test";
import assert from "node:assert";
import { XmlDocument } from "../dist/index.js";

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
    assert.notStrictEqual(child, undefined);

    // These properties should at least exist
    assert.notStrictEqual(child?.line, undefined);
    assert.notStrictEqual(child?.column, undefined);
    assert.notStrictEqual(child?.position, undefined);
    assert.notStrictEqual(child?.startTagPosition, undefined);

    // The parser property should be removed after parsing
    // @ts-expect-error
    assert.strictEqual(child?.parser, undefined);

    // Check nested element
    const grandchild = child?.childNamed("grandchild");
    assert.notStrictEqual(grandchild, undefined);
    assert.notStrictEqual(grandchild?.line, undefined);
    assert.notStrictEqual(grandchild?.column, undefined);
    assert.notStrictEqual(grandchild?.position, undefined);
    assert.notStrictEqual(grandchild?.startTagPosition, undefined);

    // The parser property should be removed after parsing
    // @ts-expect-error
    assert.strictEqual(grandchild?.parser, undefined);
  });

  test("Parser property is properly cleaned up", () => {
    const xmlString = `<root><child><grandchild /></child></root>`;
    const doc = new XmlDocument(xmlString);

    // After parsing is complete, all parser references should be removed
    const checkNoParser = (element: any) => {
      assert.strictEqual(element.parser, undefined);

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
    assert.notStrictEqual(level1, undefined);

    const level2 = level1?.childNamed("level2");
    assert.notStrictEqual(level2, undefined);

    // These properties should at least exist
    assert.notStrictEqual(level1?.line, undefined);
    assert.notStrictEqual(level1?.column, undefined);
    assert.notStrictEqual(level1?.position, undefined);
    assert.notStrictEqual(level1?.startTagPosition, undefined);

    assert.notStrictEqual(level2?.line, undefined);
    assert.notStrictEqual(level2?.column, undefined);
    assert.notStrictEqual(level2?.position, undefined);
    assert.notStrictEqual(level2?.startTagPosition, undefined);

    // The parser property should be removed after parsing
    // @ts-expect-error
    assert.strictEqual(level1?.parser, undefined);
    // @ts-expect-error
    assert.strictEqual(level2?.parser, undefined);
  });
});
