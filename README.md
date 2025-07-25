[![Build Status](https://travis-ci.org/nfarina/xmldoc.svg)](https://travis-ci.org/nfarina/xmldoc)
[![Coverage Status](https://coveralls.io/repos/github/nfarina/xmldoc/badge.svg?branch=master)](https://coveralls.io/github/nfarina/xmldoc?branch=master)

## Introduction

`xmldoc` lets you parse XML documents with ease. It's a lightweight XML document class with a single dependency on the excellent [`sax`][sax] parser.

For more on why I wrote this class, see the [blog post][blog].

As of version 2.0, `xmldoc` fully supports TypeScript and can be imported in both CommonJS and ESM environments.

[blog]: http://nfarina.com/post/34302964969/a-lightweight-xml-document-class-for-nodejs-javascript

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for details.

## Installation

```bash
npm install xmldoc
# or
yarn add xmldoc
```

Or just download the repository and include it in your `node_modules` directly. Or just download the [single JS file][blob]!

[blob]: https://github.com/nfarina/xmldoc/blob/master/lib/xmldoc.js

## Usage

### CommonJS (Node.js)

```js
const { XmlDocument } = require("xmldoc");

const document = new XmlDocument("<some>xml</some>");

// do things
```

### ESM / TypeScript

```ts
// ESM environments
import { XmlDocument } from "xmldoc";

const document = new XmlDocument("<some>xml</some>");
```

### React Native

If you're using React Native, you may need to install `buffer` and `stream` separately:

```bash
npm install buffer stream xmldoc
```

## Classes

The primary exported class is `XmlDocument`, which you'll use to consume your XML text. `XmlDocument` contains a hierarchy of `XmlElement` instances representing the XML structure.

Both `XmlElement` and `XmlDocument` contain the same members and methods you can call to traverse the document or a subtree.

## Members

| Member name                                      | Default empty value | Description                                                                                                                                                                      |
| :----------------------------------------------- | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                                           |                     | Node name, like "tat" for `<tat>`. XML "namespaces" are ignored by the underlying [sax-js](https://github.com/isaacs/sax-js) parser: so `<office:body>` becomes `"office:body"`. |
| `attr`                                           | `{}`                | Object dict containing attribute properties. Like `bookNode.attr.title` for `<book title="...">`.                                                                                |
| `val`                                            | `""`                | String "value" of the node, if any. Like `"world"` for `<hello>world</hello>`.                                                                                                   |
| `children`                                       | `[]`                | Array of `XmlElement` children of the node.                                                                                                                                      |
| `firstChild`                                     |                     | What it sounds like. `null` if no children.                                                                                                                                      |
| `lastChild`                                      |                     | What it sounds like. `null` if no children.                                                                                                                                      |
| `line`, `column`, `position`, `startTagPosition` |                     | Information about the element's original position in the XML string.                                                                                                             |

## Methods

All methods with `child` in the name operate only on direct children; they do not do a deep/recursive search.

It's important to note that `xmldoc` is designed for when you know exactly what you want from your XML file. For instance, it's great for parsing API responses with known structures, but it's not great at teasing things out of HTML documents from the web.

If you need to do lots of searching through your XML document, I highly recommend trying a different library like [node-elementtree](https://github.com/racker/node-elementtree).

### eachChild(func)

Similar to [underscore's][underscore] `each` method, it will call `func(child, index, array)` for each child of the given node.

### childNamed(name)

Pass it the name of a child node and it will search for and return the first one found, or `undefined`.

### childrenNamed(name)

Like `childNamed` but returns all matching children in an array, or `[]`.

### childWithAttribute(name,value)

Searches for the first child with the given attribute value. You can omit `value` to just find the first node with the given attribute defined at all.

### descendantWithPath(path)

Searches for a specific "path" using dot notation. Example:

```xml
<book>
  <author>
    <name isProper="true">George R. R. Martin</name>
    ...
  </author>
  ...
</book>
```

If you just want the `<name>` node and you have the `XmlElement` for the `<book>` node, you can say:

```js
var nameNode = bookNode.descendantWithPath("author.name"); // return <name> node
```

### valueWithPath(path)

Just like `descendantWithPath`, but goes deeper and extracts the `val` of the node. Example:

```js
var authorName = bookNode.valueWithPath("author.name"); // return "George R. R. Martin"
```

You can also use the `@` character to request the value of a particular _attribute_ instead:

```js
var authorIsProper = bookNode.valueWithPath("author.name@isProper"); // return "true"
```

This is not [XPath][]! It's just a thing I made up, OK?

### toString([options])

This is just an override of the standard JavaScript method, it will give you a string representation of your XML document or element. Note that this is for debugging only! It is not guaranteed to always output valid XML.

The default implementation of `toString()`, that is, the one you get when you just `console.log("Doc: " + myDoc)` will pretty-print the XML with linebreaks and indents. You can pass a couple options to control the output:

```js
xml.toString({ compressed: true }); // strips indents and linebreaks
xml.toString({ trimmed: true }); // trims long strings for easier debugging
xml.toString({ preserveWhitespace: true }); // prevents whitespace from being removed from around element values
xml.toString({ html: true }); // uses HTML self-closing tag rules for elements without children
```

Putting it all together:

```js
var xml = "<author><name>looooooong value</name></author>";
console.log(
  "My document: \n" + new XmlDocument(xml).toString({ trimmed: true }),
);
```

Prints:

    My Document:
    <hello>
      loooooooo…
    </hello>

## Feedback

Feel free to file issues or hit me up on [X][x].

[underscore]: http://underscorejs.org
[XPath]: http://en.wikipedia.org/wiki/XPath
[x]: http://twitter.com/nfarina
[sax]: https://github.com/isaacs/sax-js
