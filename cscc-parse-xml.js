/* CSCC Parse Xml - parses a single line of XML, which can be invalid
*
* Written in 2010 by Martin Kool (@mrtnkl) of Q42 (@q42) for Quplo (@quplo).
*
* Instead of writing an entire parser, this class simply parses a single line
* of XML, so it can be aware of the name, the attributes and the values.
*
* This class can easily be refactored to parsing a line of javascript, php or
* any other language. For me, I only needed xml atm.
*/
var csccParseXml = function(str, cursorPos) {
  this.str = str;
  this.cursorPos = cursorPos;
  this.attributes = {};
  this.parse();
};

// state enum
csccParseXml.atStart = 0;
csccParseXml.inTagName = 1;
csccParseXml.inAttributeName = 2;
csccParseXml.inAttributeValue = 3;
csccParseXml.inAttributeEquals = 5;
csccParseXml.beforeAttributeName = 6;
csccParseXml.afterTagOrAttribute = 7;
csccParseXml.atEnd = 99;

// prototype definition
csccParseXml.prototype =
{
  type: "xml",
  str: "",
  cursorPos: 0,
  cursorChar: "",
  tagName: "",
  attributes: {},
  attributeName: "",
  attributeQuote: "",
  attributeValue: "",
  pos: 0,
  state: csccParseXml.atStart,

  // returns a sense path such as "/script/type/tex"
  // which can contain the tag, attribute and value, partly or in whole
  getSensePath: function() {
    var path = this.tagName;
    if (this.attributeName != "") {
      path += "/" + this.attributeName;
      if (this.attributeValue != "") {
        path += "/" + this.attributeValue;
      }
    }
    return path;
  },
  parse: function() {
    this.pos = 0;
    this.next();
  },
  next: function() {
    if (this.pos >= this.cursorPos)
      return;
    var c = this.getChar(this.pos);

    switch (this.state) {
      case csccParseXml.atStart:
      case csccParseXml.inTagName:
        if (c.match(/[\w\._\-:]/)) {
          this.tagName += c;
          this.state = csccParseXml.inTagName;
        }
        else if (c.match(/[ ]/)) {
          this.state = csccParseXml.beforeAttributeName;
        }
        break;
      case csccParseXml.beforeAttributeName:
        if (c.match(/[\w\._\-]/)) {
          this.attributeName = c;
          this.state = csccParseXml.inAttributeName;
        }
        break;
      case csccParseXml.inAttributeName:
        if (c.match(/[\w\._\-]/)) {
          this.attributeName += c;
          this.state = csccParseXml.inAttributeName;
        }
        else if (c.match(/[=]/))
          this.state = csccParseXml.inAttributeEquals;
        break;
      case csccParseXml.inAttributeEquals:
        if (c.match(/['"]/)) {
          this.attributeQuote = c;
          this.state = csccParseXml.inAttributeValue;
        }
        break;
      case csccParseXml.inAttributeValue:
        if (c.match(/[\w\._\-]/)) {
          this.attributeValue += c;
          this.state = csccParseXml.inAttributeValue;
        }
        if (c == this.attributeQuote) {
          this.state = csccParseXml.afterTagOrAttribute;
        }
        break;
      case csccParseXml.afterTagOrAttribute:
        if (c.match(/[ ]/)) {
          // store old attribute + value
          this.attributes[this.attributeName] = this.attributeValue;
          this.attributeName = "";
          this.attributeValue = "";
          this.state = csccParseXml.beforeAttributeName;
        }
        break;
    }
    this.pos++;
    this.next();
  },
  getChar: function(pos) {
    return this.str.substr(pos, 1);
  }
};