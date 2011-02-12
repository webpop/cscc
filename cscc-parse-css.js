/* CSCC Parse CSS - parses a single line of CSS, which can be invalid
*
* Written in 2010 by Martin Kool (@mrtnkl) of Q42 (@q42) for Quplo (@quplo).
*
* Instead of writing an entire parser, this class simply parses a single line
* of CSS, so it can be aware of properties and values.
*/
var csccParseCss = function(str, cursorPos) {
  this.str = str;
  this.cursorPos = cursorPos;
  this.attributes = {};
  this.parse();
};

// state enum
csccParseCss.atStart = 0;
csccParseCss.inProperty = 1;
csccParseCss.beforeValue = 2;
csccParseCss.inValue = 3;
csccParseCss.atEnd = 99;

// prototype definition
csccParseCss.prototype =
{
  type: "css",
  str: "",
  cursorPos: 0,
  cursorChar: "",
  propertyName: "",
  properties: {},
  propertyValue: "",
  pos: 0,
  state: csccParseCss.atStart,

  // returns a sense path such as "/color/red"
  getSensePath: function() {
    var path = this.propertyName;
    if (this.propertyValue != "") {
      path += "/" + this.propertyValue;
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
      case csccParseCss.atStart:
      case csccParseCss.inProperty:
        if (c.match(/[\w_\-]/)) {
          this.propertyName += c;
          this.state = csccParseCss.inProperty;
        }
        else if (c.match(/[ \:]/)) {
          this.state = csccParseCss.beforeValue;
        }
        break;
      case csccParseCss.beforeValue:
        if (c.match(/[\w\._\-]/)) {
          this.propertyValue = c;
          this.state = csccParseCss.inValue;
        }
        break;
      case csccParseCss.inValue:
        if (c.match(/[\w\._\-]/)) {
          this.propertyValue += c;
          this.state = csccParseCss.inValue;
        }
        else if (c.match(/[;]/))
          this.state = csccParseCss.atEnd;
        break;
    }
    this.pos++;
    this.next();
  },
  getChar: function(pos) {
    return this.str.substr(pos, 1);
  }
};