var XmlDocument = require('../').XmlDocument
var t = require('tap')

t.test('parsing comments outside XML scope [#27]', function (t) {
  
  var xmlString = '<hello>world</hello>\n<!--Thank you for your business!-->';
  var parsed = new XmlDocument(xmlString);
  t.end();
})
