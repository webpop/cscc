/* CSCC - Common Sense Code Completion
*  Basic but practical code completion for CodeMirror
*
* Written in 2010 by Martin Kool of Q42 to help developers and designers working
* in quplo (http://quplo.com) reduce the daily amount of keystrokes.
*
* The purpose of CSCC is simple; to aid you while you type. It is not meant to be
* a full-fledged code completion engine. CSCC is not context aware, but simply
* sees what tag you are typing and offers the attributes and possible values.
*
* Follow me on twitter (@mrtnkl) or contact me directly: martin@q42.nl.
* If you want to read more on our philosophy of creating an online editor,
* follow the quplog: http://blog.quplo.com
*
* Marijn Haverbeke deserves ALL the credits as he created CodeMirror!
* http://marijn.haverbeke.nl/codemirror/index.html
*/

// Common Sense Code Completion
var cscc = {
  IE: (navigator.appName == "Microsoft Internet Explorer"),
  triggerChars: 2, // the number of tagname character after which cmc triggers
  visible: false, // if suggestions are visible
  selected: null, // the currently selected suggestion
  initialPos: 0,
  sensePath: "",
  visibleItemsType: 0, // the type of items (tags, attribute names, or values)
  currentParser: null,
  currentLeft: 0,
  currentSelect: null,
  currentEditor: null,
  elAtCursor: null,
  editor: null, // the instance of codemirror to complete

  // creates the CodeMirror instance
  init: function(textareaId) {
    cscc.addStyle();
    csccSense.init();

    // modify some values below to meet your wishes    
    var options = {
      tabMode: "shift",
      height: "90%",
      textWrapping: true,
      parserfile: ["parsexml.js", "parsecss.js", "tokenizejavascript.js", "parsejavascript.js", "parsequplo.js"],
      stylesheet: ["CodeMirror-0.93/css/xmlcolors.css", "CodeMirror-0.93/css/jscolors.css", "CodeMirror-0.93/css/csscolors.css"],
      path: "CodeMirror-0.93/js/",
      autoMatchParens: false,
      lineNumbers: false,
      cursorActivity: cscc.cursorActivity
    };
    if (!cscc.IE) {
      options.keyDownFunction = cscc.keyDown;
      options.keyUpFunction = cscc.keyUp;
    }
    cscc.editor = CodeMirror.fromTextArea(textareaId, options);
  },

  cursorActivity: function(elAtCursor) {
    if (!elAtCursor) return;
    cscc.elAtCursor = elAtCursor;
  },

  addStyle: function() {
    var style = document.createElement('style');
    var cssStr = [
      "#cmc-suggestions",
      "{",
      "  margin-top: 12px;",
      "  position: absolute;",
      "  z-index: 999;        ",
      "  font-family: tahoma;",
      "  font-size: 11px;",
      "  border: outset 1px;",
      "  background: #fff;",
      "  box-shadow: 0 2px 2px rgba(0,0,0,0.3);",
      "  -moz-box-shadow: 0 2px 2px rgba(0,0,0,0.3);",
      "  border-radius: 3px;",
      "  -moz-border-radius: 3px;",
      "  cursor:default;",
      "}",
      "#cmc-suggestions div      ",
      "{",
      "  padding: 2px 5px;",
      "}",
      "#cmc-suggestions div.selected",
      "{",
      "  background: navy;",
      "  color: #fff;",
      "}"
    ].join("");
    style.setAttribute("type", "text/css");
    if (style.styleSheet)
      style.styleSheet.cssText = cssStr;
    else {
      var cssText = document.createTextNode(cssStr);
      style.appendChild(cssText);
    }
    document.body.appendChild(style);
  },

  keyDown: function(evt, select, editor) {
    var l = cscc.getCursorInfo();
    var text = l.text.substr(0, l.pos);
    var startPos = text.lastIndexOf("<");
    var endPos = text.lastIndexOf(">");
    var inTag = startPos > endPos;
    var brEl = l.obj.line;

    // handle basic cursor and other key activity
    switch (evt.keyCode) {
      case 38: // up
        if (cscc.visible) {
          cscc.prev();
          evt.stop();
          return false;
        }
        break;
      case 40: // down
        if (cscc.visible) {
          cscc.next();
          evt.stop();
          return false;
        }
        break;
      case 13: // enter
      case 9: // tab
        if (cscc.visible) {
          cscc.pick(evt, select, editor);
          return false;
        }
        break;
      case 27: // escape
        if (cscc.visible) {
          cscc.hide();
          evt.stop();
          return false;
        }
        break;
    }

    // if we're not inside a tag, keydown is finished
    if (!inTag) {
      cscc.hide();
      return true;
    }

    // get the tagName that we're in
    text = text.substr(startPos + 1);
    var tagName = text.replace(/^([\w\._\-]+).*$/, "$1");

    // ">" pressed, check for autoclosing the tag
    if (evt.shiftKey && evt.keyCode == 190) {
      if (text.match(/^[\w\._\-]+.*?$/) && !text.match(/\/$/)) {
        var endTag = "</" + tagName + ">";
        if (l.text.indexOf(endTag) == -1) {
          // auto insert closing tag
          select.insertAtCursor(">" + endTag);
          evt.stop();
          select.setCursorPos(editor.container, { node: l.obj.line, offset: l.pos + 1 });
        }
      }
    }
    return true;
  },

  keyUp: function(evt, select, editor) {
    var k = evt.keyCode;

    if (k == 13) return; // enter
    if (k == 35 || k == 36 && cscc.visible) return cscc.hide(); // home end
    if (k == 37 || k == 39) return cscc.hide(); // left, right
    if (k != 8 && k != 32 && k < 65) return;

    var l = cscc.getCursorInfo();
    var text = l.text.substr(0, l.pos);
    var startPos = text.lastIndexOf("<");
    var endPos = text.lastIndexOf(">");
    var inTag = startPos > endPos;

    if (!inTag) {
      var inCssStateDeclaration = cscc.isInCssDeclaration(l);
      if (inCssStateDeclaration) {
        var curPos = l.pos;

        for (var c in { "{": 1, ";": 1 }) {
          startPos = text.lastIndexOf(c);
          if (startPos != -1) {
            text = text.substr(startPos + 1);
            curPos -= (startPos + 1);
          }
        }

        var declarationPart = text.replace(/^\s*(.*)$/gi, "$1");
        indentationLength = text.length - declarationPart.length;
        curPos -= indentationLength;
        text = declarationPart;

        var parser = new csccParseCss(text, curPos);
        cscc.update(l, parser, evt, select, editor);
      }
      return;
    }

    text = text.substr(startPos + 1);
    var tagName = text.replace(/^([\w\._\-]+)[^\/]*$/, "$1");

    // autocomplete quotes, so id= becomes id="" whith cursor properly placed
    if (!evt.shiftKey && (evt.keyCode == 107 || evt.keyCode == 187)) {
      var p = new csccParseXml(text, l.pos - startPos);
      if (p.state == csccParseXml.inAttributeEquals) {
        select.insertAtCursor("\"\"");
        select.setCursorPos(editor.container, { node: l.obj.line, offset: l.pos + 1 });
        evt.stop();
        // refresh cursor position and text, so the parser takes into account our added quotes
        l = cscc.getCursorInfo();
        text = l.text.substr(0, l.pos);
      }
    }

    // see if we have anything to suggest
    var parser = new csccParseXml(text, l.pos - startPos);
    cscc.update(l, parser, evt, select, editor);
  },

  // simple wrapper method to get some cursor information from codemirror
  getCursorInfo: function() {
    var lineNo = cscc.editor.currentLine();
    var curPosObj = cscc.editor.cursorPosition();
    var line = cscc.editor.lineContent(curPosObj.line);
    return {
      line: lineNo,
      pos: curPosObj.character,
      text: line,
      obj: curPosObj
    };
  },

  // gets the suggestions container
  getSuggestionsElement: function() {
    var wrap = cscc.editor.wrapping;
    var doc = wrap.ownerDocument;
    var el = doc.getElementById("cmc-suggestions");
    if (!el) {
      var el = doc.createElement("div");
      el.setAttribute("id", "cmc-suggestions");
      wrap.appendChild(el);
    }
    return el;
  },

  // returns the object, or when it is a function returns its resulting object
  getValueOrFunctionResult: function(obj) {
    return (typeof obj == "function") ? obj() : obj;
  },

  // parses the sensePath and gets the items for it
  getItemsForPath: function(parser, type) {

    function isOfType(obj, t) {
      obj = cscc.getValueOrFunctionResult(obj);
      if (obj == t) return true;
      for (n in obj) {
        if (obj[n] == (t + 1)) return true;
        for (m in obj[n]) {
          if (obj[n][m] == (t + 2)) return true;
        }
      }
      return false;
    }

    var dictionary = csccSense[parser.type + "Dictionary"];
    cscc.visibleItemsType = type;
    var items = [];
    var parts = parser.getSensePath().split("/");
    var curSense = dictionary;
    var fragment = null;

    // iterate over the parts and see where we're at
    for (var i = 0; i < parts.length; i++) {
      var partName = parts[i];
      if (curSense && curSense[partName]) {
        curSense = curSense[partName];
      }
      else if (dictionary[partName]) {
        curSense = dictionary[partName];
      }
      else
        fragment = partName;
      if (curSense)
        curSense = cscc.getValueOrFunctionResult(curSense);
    }

    // if cscc is making sense, prepare the result
    if (curSense) {
      for (var name in curSense) {
        if (!parser.attributes || parser.attributes[name] == null)
          if (isOfType(curSense[name], type))
          if (!fragment || name.toLowerCase().indexOf(fragment.toLowerCase()) == 0)
          items.push(name);
      }
    }
    return items;
  },

  // fills the suggestions element with the right items
  fill: function(items) {
    var isFont = cscc.currentParser.getSensePath().indexOf("font-family") == 0;
    var selectedValue = "";
    if (cscc.selected)
      selectedValue = cscc.selected.innerHTML;
    var root = cscc.getSuggestionsElement();
    root.innerHTML = "";
    cscc.selected = null;
    var newSelectedEl = null;

    // add the items, and take into account the prev selected item
    for (var i = 0; i < items.length; i++) {
      var el = root.ownerDocument.createElement("div");
      var value = items[i].replace(/\|/, "");
      el.setAttribute("rel", items[i]);
      el.innerHTML = value;
      if (isFont) el.style.fontFamily = value;

      root.appendChild(el);
      if (!newSelectedEl)
        newSelectedEl = el;
      if (items[i] == selectedValue) {
        newSelectedEl = el;
      }
    }
    if (newSelectedEl)
      newSelectedEl.className = "selected";
    cscc.selected = newSelectedEl;
  },

  // pop up the suggestions element
  show: function(line, pos, items) {
    if (!cscc.visible)
      cscc.selected = null;
    cscc.fill(items);

    // following lines modified by we:willRockYou - CodeMirror now has
    // it's own methods to get cursorCoords()!
    // See http://we.willrockyou.net/webEdition-editor-demo/
    // Also see original comments by Daniel (@we_willRockYou) on Quplog:
    // http://blog.quplo.com/2010/06/css-code-completion-in-your-browser/
    var el = cscc.getSuggestionsElement();
    el.style.display = "block";
    el.setAttribute("size", items.length);
    el.style.top = cscc.editor.cursorCoords().y-5 + "px";
    el.style.left = cscc.editor.cursorCoords().x-7 + "px";

    cscc.visible = true;
    if (!cscc.selected)
      cscc.next();
  },

  // hide the box
  hide: function() {
    cscc.getSuggestionsElement().style.display = "none";
    cscc.visible = false;
  },

  // update the current suggestions box, if needed
  update: function(lineObj, parser, evt, select, editor) {
    cscc.currentParser = parser;
    cscc.currentSelect = select;
    cscc.currentEditor = editor;
    var items = [];
    switch (parser.type) {
      case "xml":
        switch (parser.state) {
          case csccParseXml.atStart:
          case csccParseXml.inTagName:
            var currentTag = parser.tagName;
            if (currentTag.length < cscc.triggerChars) return;
            items = cscc.getItemsForPath(parser, 1);
            break;
          case csccParseXml.beforeAttributeName:
          case csccParseXml.inAttributeName:
          case csccParseXml.afterTagOrAttribute:
            items = cscc.getItemsForPath(parser, 2);
            break;
          case csccParseXml.inAttributeValue:
            items = cscc.getItemsForPath(parser, 3);
            break;
        }
        break;
      case "css":
        switch (parser.state) {
          case csccParseCss.atStart:
          case csccParseCss.inProperty:
            var currentProperty = parser.propertyName;
            if (currentProperty.length < cscc.triggerChars) return;
            items = cscc.getItemsForPath(parser, 1);
            break;
          case csccParseCss.beforeValue:
          case csccParseCss.inValue:
            items = cscc.getItemsForPath(parser, 2);
            break;
        }
        break;
    }
    if (items.length > 0)
      cscc.show(lineObj.line, lineObj.pos, items);
    else
      cscc.hide();
  },

  // highlight the next suggestion
  next: function() {
    var results = cscc.getSuggestionsElement().getElementsByTagName("div");
    var selectedIndex = -1;
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      if (result.className.indexOf("selected") != -1) {
        selectedIndex = i;
        result.className = "";
      }
    }
    if (selectedIndex < results.length - 1)
      selectedIndex++;
    else
      selectedIndex = 0;
    if (results[selectedIndex]) {
      cscc.selected = results[selectedIndex];
      results[selectedIndex].className = "selected";
    }
  },

  // highlight the previous suggestion
  prev: function() {
    var results = cscc.getSuggestionsElement().getElementsByTagName("div");
    var selectedIndex = -1;
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      if (result.className.indexOf("selected") != -1) {
        selectedIndex = i;
        result.className = "";
      }
    }
    if (selectedIndex > 0)
      selectedIndex--;
    else
      selectedIndex = results.length - 1;
    if (results[selectedIndex]) {
      cscc.selected = results[selectedIndex];
      results[selectedIndex].className = "selected";
    }
  },

  // highlight the first suggestion
  first: function() {
    var results = cscc.getSuggestionsElement().getElementsByTagName("div");
    var selectedIndex = -1;
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      result.className = (i == 0) ? "selected" : "";
    }
  },

  // highlight the last suggestion
  last: function() {
    var results = cscc.getSuggestionsElement().getElementsByTagName("div");
    var selectedIndex = -1;
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      result.className = (i == results.length - 1) ? "selected" : "";
    }
  },

  // pick the highlighted suggestion
  pick: function(evt, select, editor) {
    if (cscc.selected) {
      var l = cscc.getCursorInfo();
      var pos = l.pos;
      cscc.hide();
      var text = cscc.selected.innerHTML;
      var cursorPos = cscc.selected.getAttribute("rel").indexOf("|");
      var cursorOffset = 0;
      var textOffset = 0; // used for the amount of extra text we insert, like ": "
      if (cursorPos != -1)
        cursorOffset = cursorPos - text.length - 1;

      switch (this.currentParser.type) {
        case "css":
          if (cscc.visibleItemsType == 1) {
            text = text.substr(cscc.currentParser.propertyName.length);
            text += ": ";
            textOffset = 2;
            select.insertAtCursor(text);
            if (evt.stop) evt.stop();

            // when picking the attribute name, reupdate intellisense for possible attribute values
            setTimeout(function() {
              var l = cscc.getCursorInfo();
              text = l.text;
              var curPos = l.pos;

              for (var c in { "{": 1, ";": 1 }) {
                startPos = text.lastIndexOf(c);
                if (startPos != -1) {
                  text = text.substr(startPos + 1);
                  curPos -= (startPos + 1);
                }
              }

              var declarationPart = text.replace(/^\s*(.*)$/gi, "$1");
              indentationLength = text.length - declarationPart.length;
              curPos -= indentationLength;
              text = declarationPart;

              var parser = new csccParseCss(text, l.pos - startPos);
              cscc.update(l, parser, evt);
            }, 0);
          }
          if (cscc.visibleItemsType == 2) {
            text = text.substr(cscc.currentParser.propertyValue.length);
            text += ";";
            textOffset = 1;
            select.insertAtCursor(text);
            if (evt.stop) evt.stop();
          }
          break;
        case "xml":
          if (cscc.visibleItemsType == 1) {
            text = text.substr(cscc.currentParser.tagName.length);
            select.insertAtCursor(text);
            if (evt.stop) evt.stop();
          }
          if (cscc.visibleItemsType == 2) {
            text = text.substr(cscc.currentParser.attributeName.length);
            text += "=\"\"";
            select.insertAtCursor(text);
            select.setCursorPos(editor.container, { node: l.obj.line, offset: l.pos + text.length - 1 });
            if (evt.stop) evt.stop();

            // when picking the attribute name, reupdate intellisense for possible attribute values
            setTimeout(function() {
              var l = cscc.getCursorInfo();
              var text = l.text.substr(0, l.pos);
              var startPos = text.lastIndexOf("<");
              text = text.substr(startPos + 1);
              var parser = new csccParseXml(text, l.pos - startPos);
              cscc.update(l, parser, evt);
            }, 0);
          }
          if (cscc.visibleItemsType == 3) {
            text = text.substr(cscc.currentParser.attributeValue.length);
            select.insertAtCursor(text);
            select.setCursorPos(editor.container, { node: l.obj.line, offset: l.pos + text.length + 1 });
            if (evt.stop) evt.stop();
          }
          break;
      }

      // offset cursor if "|" was present in a value
      if (cursorOffset != 0) {
        var l = cscc.getCursorInfo();
        select.setCursorPos(editor.container, { node: l.obj.line, offset: l.pos + (cursorOffset - textOffset + 1) });
      }
    }
  },
  isInCssDeclaration: function(cursorInfo) {
    var parseEl = cscc.elAtCursor;
    if (parseEl == null || parseEl.previousSibling == null) {
      parseEl = cursorInfo.obj.line;
      parseEl = cscc.editor.nextLine(parseEl);
    }
    var state = 0;
    while (parseEl) {
      if (parseEl.tagName != "BR" && parseEl.nodeType != 3) {
        var cn = parseEl.className;
        if (!cn) break;
        if (cn != "whitespace") {
          if (cn.indexOf("css-") != 0)
            break;
          else {
            if (cn == "css-punctuation" && parseEl.innerHTML.indexOf("{") == 0) {
              state = 2; break;
            }
            if (cn == "css-punctuation" && parseEl.innerHTML.indexOf("}") == 0) {
              state = 1; break;
            }
          }
        }
      }
      parseEl = parseEl.previousSibling;
    }
    return state == 2;
  }
};