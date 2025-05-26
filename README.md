[![Build Status](https://travis-ci.org/nfarina/xmldoc.svg)](https://travis-ci.org/nfarina/xmldoc)
[![Coverage Status](https://coveralls.io/repos/github/nfarina/xmldoc/badge.svg?branch=master)](https://coveralls.io/github/nfarina/xmldoc?branch=master)

## Introduction

`xmldoc` makes parsing XML documents easy. It's a lightweight XML document class with _one_ dependency: the excellent [`sax`][sax] parser.

Read my [blog post][blog] to learn why I wrote this XML document class.

Starting from version 2.0, `xmldoc` supports TypeScript, and can be imported in CommonJS and ESM environments.

[blog]: http://nfarina.com/post/34302964969/a-lightweight-xml-document-class-for-nodejs-javascript

## Release Notes

Read the [CHANGELOG.md](./CHANGELOG.md) file for the release notes.

## Installation

Install `xmldoc` with `npm` or `yarn`:

```bash
npm install xmldoc
# or
yarn add xmldoc
```

Or download this repository and include it in your `node_modules`.

Or download the [single JS file][blob]!

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

If you're using React Native, you may need to install `buffer` and `stream` too:

```bash
npm install buffer stream xmldoc
```

## Classes

The primary exported class is `XmlDocument`, which you'll use to consume your XML text. `XmlDocument` contains a hierarchy of `XmlElement` instances representing the XML structure.

`XmlElement` and `XmlDocument` have the same members and methods, which you can call to traverse the document or subtree.

## Members

- `name` - the node name, like "tat" for `<tat>`. XML "namespaces" are ignored by the underlying [sax-js](https://github.com/isaacs/sax-js) parser, so you'll simply get "office:body" for `<office:body>`.
- `attr` - an object dict containing attribute properties, like `bookNode.attr.title` for `<book title="...">`.
- `val` - the string "value" of the node, if any, like "world" for `<hello>world</hello>`.
- `children` - an array of `XmlElement` children of the node.
- `firstChild`, `lastChild` - pretty much what it sounds like; null if no children
- `line`, `column`, `position`, `startTagPosition` - information about the element's original position in the XML string.

Each member defaults to a sensible "empty" value like `{}` for `attr`, `[]` for `children`, and `""` for `val`.

## Methods

All methods with `child` in the name operate only on _direct_ children. Methods with `child` in the name will not perform a deep/recursive search.

`xmldoc` works best with _structured_ data as input, like parsing API responses. 

`xmldoc` is not designed to help you extract items from HTML documents from the web.
If you need to search through your XML document, I recommend trying a different library like [node-elementtree](https://github.com/racker/node-elementtree).

### eachChild(func)

Similar to [underscore's][underscore] `each` method, it calls `func(child, index, array)` for each child of the given node.

### childNamed(name)

Pass it the name of a child node and it will search for and return the _first_ child node it finds.
Else the response is `undefined`.

### childrenNamed(name)

Like `childNamed` but returns _all_ matching children in an array, or `[]`.

### childWithAttribute(name,value)

Search for the _first_ child with the given attribute value. Omit the `value` part to find the first node with the given attribute defined.

### descendantWithPath(path)

Search for a specific "path" using dot notation. For example:

```xml
<book>
  <author>
    <name isProper="true">George R. R. Martin</name>
    ...
  </author>
  ...
</book>
```

If you only want the `<name>` node and you know the `XmlElement` for the `<book>` node, you can do:

```js
var nameNode = bookNode.descendantWithPath("author.name"); // return <name> node
```

### valueWithPath(path)

Like `descendantWithPath`, but goes deeper and extracts the `val` of the node. For example:

```js
var authorName = bookNode.valueWithPath("author.name"); // return "George R. R. Martin"
```

Use the `@` character to request the value of a particular _attribute_ instead:

```js
var authorIsProper = bookNode.valueWithPath("author.name@isProper"); // return "true"
```

This is not [XPath][]! It's just a thing I made up, OK?

### toString([options])

For debugging only! This function may return wrongly formatted XML.

`toString` overrides the standard JavaScript method.
It returns a string representation of your XML document (or element). .

The default implementation of `toString()`, that is, the one you get when you just `console.log("Doc: " + myDoc)` pretty-prints the XML, with linebreaks and indents. You can pass a couple options to control the output:

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

Feel free to file issues on GitHub, or hit me up on [X][x].

[underscore]: http://underscorejs.org
[XPath]: http://en.wikipedia.org/wiki/XPath
[x]: http://twitter.com/nfarina
[sax]: https://github.com/isaacs/sax-js
