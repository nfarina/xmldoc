import sax, { SAXParser } from "sax";

/**
 * Options for XML string output formatting
 */
export interface XmlStringOptions {
  /** Remove indentation and linebreaks when outputting XML */
  compressed?: boolean;
  /** Truncate long string values for easier debugging */
  trimmed?: boolean;
  /** Prevent whitespace from being removed around element values */
  preserveWhitespace?: boolean;
  /** Use HTML self-closing tag rules for elements without children */
  html?: boolean;
}

/**
 * Base interface for all XML node types
 */
export interface XmlNodeBase {
  /** The type of node (element, text, cdata, comment) */
  type: string;
  /**
   * Converts the node to a string representation
   * @param options Formatting options
   * @returns String representation of the node
   */
  toString(options?: XmlStringOptions): string;
  /**
   * Converts the node to a string with the specified indentation
   * @param indent The indentation to use
   * @param options Formatting options
   * @returns String representation of the node with indentation
   */
  toStringWithIndent(indent: string, options?: XmlStringOptions): string;
}

// Interface for sax parser events handlers
interface XmlDelegate {
  _opentag(tag: { name: string; attributes: Record<string, string> }): void;
  _closetag(): void;
  _text(text: string): void;
  _cdata(cdata: string): void;
  _comment(comment: string): void;
  _error(err: Error): void;
}

/**
 * Represents a text node in an XML document
 */
export class XmlTextNode implements XmlNodeBase {
  readonly type = "text";

  /**
   * Creates a new text node
   * @param text The text content
   */
  constructor(public text: string) {}

  /**
   * Converts the text node to a string
   * @param options Formatting options
   * @returns String representation of the text node
   */
  toString(options?: XmlStringOptions): string {
    return formatText(escapeXML(this.text), options);
  }

  /**
   * Converts the text node to a string with indentation
   * @param indent The indentation to use
   * @param options Formatting options
   * @returns String representation of the text node with indentation
   */
  toStringWithIndent(indent: string, options?: XmlStringOptions): string {
    return indent + this.toString(options);
  }
}

/**
 * Represents a CDATA node in an XML document
 */
export class XmlCDataNode implements XmlNodeBase {
  readonly type = "cdata";

  /**
   * Creates a new CDATA node
   * @param cdata The CDATA content
   */
  constructor(public cdata: string) {}

  /**
   * Converts the CDATA node to a string
   * @param options Formatting options
   * @returns String representation of the CDATA node
   */
  toString(options?: XmlStringOptions): string {
    return `<![CDATA[${formatText(this.cdata, options)}]]>`;
  }

  /**
   * Converts the CDATA node to a string with indentation
   * @param indent The indentation to use
   * @param options Formatting options
   * @returns String representation of the CDATA node with indentation
   */
  toStringWithIndent(indent: string, options?: XmlStringOptions): string {
    return indent + this.toString(options);
  }
}

/**
 * Represents a comment node in an XML document
 */
export class XmlCommentNode implements XmlNodeBase {
  readonly type = "comment";

  /**
   * Creates a new comment node
   * @param comment The comment content
   */
  constructor(public comment: string) {}

  /**
   * Converts the comment node to a string
   * @param options Formatting options
   * @returns String representation of the comment node
   */
  toString(options?: XmlStringOptions): string {
    return `<!--${formatText(escapeXML(this.comment), options)}-->`;
  }

  /**
   * Converts the comment node to a string with indentation
   * @param indent The indentation to use
   * @param options Formatting options
   * @returns String representation of the comment node with indentation
   */
  toStringWithIndent(indent: string, options?: XmlStringOptions): string {
    return indent + this.toString(options);
  }
}

/**
 * Represents an XML element node with children
 */
export class XmlElement implements XmlNodeBase, XmlDelegate {
  readonly type = "element";
  /** The node name, like "tat" for <tat> */
  name: string;
  /** An object containing attributes, like bookNode.attr.title for <book title="..."> */
  attr: Record<string, string>;
  /** The string value of the node, like "world" for <hello>world</hello> */
  val: string;
  /** Array of child nodes */
  children: XmlNodeBase[];
  /** The first child node, or null if no children */
  firstChild: XmlNodeBase | null;
  /** The last child node, or null if no children */
  lastChild: XmlNodeBase | null;

  /** Line number of the element in the original XML */
  line: number | null;
  /** Column number of the element in the original XML */
  column: number | null;
  /** Character position of the element in the original XML */
  position: number | null;
  /** Character position of the start tag in the original XML */
  startTagPosition: number | null;

  /**
   * Creates a new XML element
   * @param tag The tag name and attributes
   * @param parser Optional SAX parser instance with position information
   */
  constructor(
    tag: { name: string; attributes: Record<string, string> },
    parser?: SAXParser,
  ) {
    this.name = tag.name;
    this.attr = tag.attributes;
    this.val = "";
    this.children = [];
    this.firstChild = null;
    this.lastChild = null;

    // Assign parse information
    this.line = parser ? parser.line : null;
    this.column = parser ? parser.column : null;
    this.position = parser ? parser.position : null;
    this.startTagPosition = parser ? parser.startTagPosition : null;
  }

  /**
   * Adds a child node to this element
   * @param child The child node to add
   */
  protected _addChild(child: XmlNodeBase): void {
    // add to our children array
    this.children.push(child);

    // update first/last pointers
    if (!this.firstChild) this.firstChild = child;
    this.lastChild = child;
  }

  _opentag(tag: { name: string; attributes: Record<string, string> }): void {
    const child = new XmlElement(tag);
    this._addChild(child);
    delegates.unshift(child);
  }

  _closetag(): void {
    delegates.shift();
  }

  _text(text: string): void {
    this.val += text;
    this._addChild(new XmlTextNode(text));
  }

  _cdata(cdata: string): void {
    this.val += cdata;
    this._addChild(new XmlCDataNode(cdata));
  }

  _comment(comment: string): void {
    this._addChild(new XmlCommentNode(comment));
  }

  _error(err: Error): void {
    throw err;
  }

  /**
   * Iterates through each child element of this node
   * @param iterator Function to call for each child element
   * @param context Optional context to use for the iterator function
   */
  eachChild(
    iterator: (
      child: XmlElement,
      index: number,
      array: XmlNodeBase[],
    ) => boolean | void,
    context?: any,
  ): void {
    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (child.type === "element") {
        if (
          iterator.call(context, child as XmlElement, i, this.children) ===
          false
        )
          return;
      }
    }
  }

  /**
   * Finds the first child element with the given name
   * @param name The name of the child element to find
   * @returns The first matching child element, or undefined if not found
   */
  childNamed(name: string): XmlElement | undefined {
    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (child.type === "element" && (child as XmlElement).name === name) {
        return child as XmlElement;
      }
    }
    return undefined;
  }

  /**
   * Finds all child elements with the given name
   * @param name The name of the child elements to find
   * @returns Array of matching child elements
   */
  childrenNamed(name: string): XmlElement[] {
    const matches: XmlElement[] = [];

    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (child.type === "element" && (child as XmlElement).name === name) {
        matches.push(child as XmlElement);
      }
    }

    return matches;
  }

  /**
   * Finds the first child element with the given attribute
   * @param name The name of the attribute to find
   * @param value Optional value the attribute should have
   * @returns The first matching child element, or undefined if not found
   */
  childWithAttribute(name: string, value?: string): XmlElement | undefined {
    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (
        child.type === "element" &&
        ((value !== undefined && (child as XmlElement).attr[name] === value) ||
          (value === undefined && (child as XmlElement).attr[name]))
      ) {
        return child as XmlElement;
      }
    }
    return undefined;
  }

  /**
   * Finds all descendant elements with the given name, searching recursively
   * @param name The name of the descendant elements to find
   * @returns Array of matching descendant elements
   */
  descendantsNamed(name: string): XmlElement[] {
    const matches: XmlElement[] = [];

    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (child.type === "element") {
        const element = child as XmlElement;
        if (element.name === name) matches.push(element);
        matches.push(...element.descendantsNamed(name));
      }
    }

    return matches;
  }

  /**
   * Finds a descendant element using a dot-notation path
   * @param path The path to the descendant, e.g. "author.name"
   * @returns The matching descendant element, or undefined if not found
   * @example
   * // For XML: <book><author><name>John</name></author></book>
   * bookNode.descendantWithPath("author.name") // returns the <name> element
   */
  descendantWithPath(path: string): XmlElement | undefined {
    let descendant: XmlElement | undefined = this;
    const components = path.split(".");

    for (let i = 0, l = components.length; i < l; i++) {
      if (descendant && descendant.type === "element") {
        descendant = descendant.childNamed(components[i]);
      } else {
        return undefined;
      }
    }

    return descendant;
  }

  /**
   * Gets the value of a descendant element or attribute using a path
   * @param path The path to the descendant or attribute, e.g. "author.name" or "author.name@id"
   * @returns The value of the descendant or attribute, or undefined if not found
   * @example
   * // For XML: <book><author><name id="1">John</name></author></book>
   * bookNode.valueWithPath("author.name")    // returns "John"
   * bookNode.valueWithPath("author.name@id") // returns "1"
   */
  valueWithPath(path: string): string | undefined {
    const components = path.split("@");
    const descendant = this.descendantWithPath(components[0]);

    if (descendant) {
      return components.length > 1
        ? descendant.attr[components[1]]
        : descendant.val;
    } else {
      return undefined;
    }
  }

  /**
   * Converts the element to a string representation
   * @param options Formatting options
   * @returns String representation of the element
   */
  toString(options?: XmlStringOptions): string {
    return this.toStringWithIndent("", options);
  }

  /**
   * Converts the element to a string with the specified indentation
   * @param indent The indentation to use
   * @param options Formatting options
   * @returns String representation of the element with indentation
   */
  toStringWithIndent(indent: string, options?: XmlStringOptions): string {
    let s = `${indent}<${this.name}`;
    const linebreak = options?.compressed ? "" : "\n";

    for (const name in this.attr) {
      if (Object.prototype.hasOwnProperty.call(this.attr, name)) {
        s += ` ${name}="${escapeXML(this.attr[name])}"`;
      }
    }

    if (this.children.length === 1 && this.children[0].type !== "element") {
      s += `>${this.children[0].toString(options)}</${this.name}>`;
    } else if (this.children.length) {
      s += `>${linebreak}`;

      const childIndent = indent + (options?.compressed ? "" : "  ");

      for (let i = 0, l = this.children.length; i < l; i++) {
        s += `${this.children[i].toStringWithIndent(
          childIndent,
          options,
        )}${linebreak}`;
      }

      s += `${indent}</${this.name}>`;
    } else if (options?.html) {
      const whiteList = [
        "area",
        "base",
        "br",
        "col",
        "embed",
        "frame",
        "hr",
        "img",
        "input",
        "keygen",
        "link",
        "menuitem",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
      ];

      if (whiteList.includes(this.name)) {
        s += "/>";
      } else {
        s += `></${this.name}>`;
      }
    } else {
      s += "/>";
    }

    return s;
  }
}

// Interface for XmlDocument with doctype method
interface XmlDocumentDelegate extends XmlDelegate {
  _doctype(doctype: string): void;
}

/**
 * The main XML document class - the entry point for parsing XML
 */
export class XmlDocument extends XmlElement implements XmlDocumentDelegate {
  /** The document's doctype declaration, if any */
  doctype: string;
  /** The SAX parser instance (available only during parsing) */
  parser?: SAXParser;

  /**
   * Creates a new XML document from an XML string
   * @param xml The XML string to parse
   * @throws {Error} If the XML is empty or invalid
   * @example
   * ```ts
   * import { XmlDocument } from 'xmldoc';
   *
   * const doc = new XmlDocument("<root><child>value</child></root>");
   * console.log(doc.childNamed("child")?.val); // "value"
   * ```
   */
  constructor(xml: string) {
    // Initialize with a dummy tag that will be replaced
    super({ name: "", attributes: {} });

    xml = xml.toString().trim();

    if (!xml) {
      throw new Error("No XML to parse!");
    }

    // Stores doctype (if defined)
    this.doctype = "";

    // Expose the parser to the other delegates while the parser is running
    this.parser = sax.parser(true); // strict
    addParserEvents(this.parser);

    // Initialize delegates with this document
    delegates = [this];

    try {
      this.parser.write(xml);
    } finally {
      // Remove the parser as it is no longer needed
      delete this.parser;
    }
  }

  _opentag(tag: { name: string; attributes: Record<string, string> }): void {
    if (this.name === "") {
      // First tag becomes the root - we'll update our own properties
      this.name = tag.name;
      this.attr = tag.attributes;
    } else {
      // All other tags will be the root element's children
      super._opentag(tag);
    }
  }

  _doctype(doctype: string): void {
    this.doctype += doctype;
  }
}

// Helper variables and functions
let delegates: (XmlElement | XmlDocument)[] = [];

function addParserEvents(parser: SAXParser): void {
  parser.onopentag = (tag: any) => delegates[0]?._opentag(tag);
  parser.onclosetag = () => delegates[0]?._closetag();
  parser.ontext = (text: string) => delegates[0]?._text(text);
  parser.oncdata = (cdata: string) => delegates[0]?._cdata(cdata);
  parser.oncomment = (comment: string) => delegates[0]?._comment(comment);
  parser.ondoctype = (doctype: string) => {
    const doc = delegates[0] as XmlDocument;
    if (doc._doctype) doc._doctype(doctype);
  };
  parser.onerror = (err: Error) => delegates[0]?._error(err);
}

/**
 * Escapes XML special characters
 * @param value The string to escape
 * @returns The escaped string
 */
function escapeXML(value: string): string {
  return value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");
}

/**
 * Formats text for display according to the given options
 * @param text The text to format
 * @param options Formatting options
 * @returns The formatted text
 */
function formatText(text: string, options?: XmlStringOptions): string {
  let finalText = text;

  if (options?.trimmed && text.length > 25) {
    finalText = finalText.substring(0, 25).trim() + "…";
  }

  if (!options?.preserveWhitespace) {
    finalText = finalText.trim();
  }

  return finalText;
}

// Export main classes
export default XmlDocument;
