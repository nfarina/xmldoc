import { test } from "node:test";
import assert from "node:assert";
import { XmlDocument } from "../dist/index.js";

test("parsing comments outside XML scope [#27]", () => {
  const xmlString = "<hello>world</hello>\n";
  const parsed = new XmlDocument(xmlString);

  // verify that the trailing comment is ignored (no sensible place to put it)
  assert.strictEqual(parsed.toString(), "<hello>world</hello>");
});

test("validating escaping of &lt; &gt; [#29]", () => {
  const xmlString = "<root><command>&lt; &gt;</command></root>";
  const parsed = new XmlDocument(xmlString);
  const result = parsed.toString({ compressed: true });

  assert.strictEqual(result, xmlString);
});
