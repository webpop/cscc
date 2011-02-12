/* CSCC-Sense - the dictionary format for CSCC suggestions
*
* Written in 2010 by Martin Kool (@mrtnkl) of Q42 (@q42) for Quplo (@quplo).
*
* This format is exremely simple. It allows you to specify what tags you want,
* what attributes are in that tag and the possible values per attribute.
*
* The order in which you write stuff is the order in which it is presented.
* This is intended behavior, as it speeds up your typing.
*
* There's a simple mechanism in place to re-use attribute sets, so you don't
* have to overspecify your elements, tags and values. Every return value can
* be an javascript function, which allows you to return results dynamically,
* based on whatever you prefer.
*
* For example, in our online HTML prototyping environment Quplo (http://quplo.com)
* we offer an xml / html hybrid format which has <layout> and <page> tags. 
* The <page> tag has a layout attribute (<page layout="foo">), and its values are
* generated on the fly based on the layouts that you have written.
*/

// csccSense is the dictionary for suggesting tags, attributes and values
var csccSense =
{
  cssDictionary: {},
  xmlDictionary: {},

  // this is just my custom array of elements that have common attributes and nothing more
  commonElements: "div,p,span,br,hr,h1,h2,h3,h4,h5,h6,blockquote,code,ol,ul,li,fieldset,legend,em,strong,em,dl,dd,dt,pre,q,small,big,sup,sub,thead,tbody,tfoot,tr,th,center".split(","),

  // This is a simple helper function, and you can create as many as you want.
  // In this case, it simply adds id, class, style and title as attributes, to the
  // given set of custom attributes that you pass in the obj parameter
  commonAttributes: function(obj) {
    var result = {};
    // if you pass custom attributes, add them first so they show up first
    if (obj) for (var n in obj) result[n] = obj[n];
    // second, add the common attributes
    for (var n in { "id": 2, "class": 2, "style": 2, "title": 2 })
      result[n] = 2;
    // return the function that results the results
    return new function() {
      // did you know that you can dynamically check for some arbitrary condition,
      // and return 0 in order for this resultset NOT to show up?
      return result;
    }
  },
  // upon initialization, fill the dictionary
  init: function() {

    this.cssDictionary =
    {
      "background": 1,
      "background-color": { "transparent": 2, "fixed": 2 },
      "background-image": { "url('/|')": 2 },
      "background-repeat": 1,
      "background-position": 1,
      "background-attachment": { "scroll": 2, "fixed": 2 },
      "border": { "solid |": 2, "dashed |": 2, "dotted |": 2 },
      "border-top": 1,
      "border-right": 1,
      "border-bottom": 1,
      "border-left": 1,
      "border-color": 1,
      "border-width": 1,
      "border-style": 1,
      "border-spacing": 1,
      "border-collapse": { "collapse": 2, "separate": 2 },
      "bottom": { "px": 2, "em": 2, "%": 2 },
      "clear": { "left": 2, "right": 2, "both": 2, "none": 2 },
      "clip": 1,
      "color": { "#|": 2, "rgb(#|0,0,0)": 2 },
      "content": 1,
      "cursor": { "default": 2, "pointer": 2, "move": 2, "text": 2, "wait": 2, "help": 2, "progress": 2, "n-resize": 2, "ne-resize": 2, "e-resize": 2, "se-resize": 2, "s-resize": 2, "sw-resize": 2, "w-resize": 2, "nw-resize": 2 },
      "display": { "none": 2, "block": 2, "inline": 2, "inline-block": 2, "table-cell": 2 },
      "empty-cells": { "show": 2, "hide": 2 },
      "float": { "left": 2, "right": 2, "none": 2 },
      "font-family": {"Arial":2,"Comic Sans MS":2,"Consolas":2,"Courier New":2,"Courier":2,"Georgia":2,"Monospace":2,"Sans-Serif":2, "Segoe UI":2,"Tahoma":2,"Times New Roman":2,"Trebuchet MS":2,"Verdana": 2},
      "font-size": { "px": 2, "em": 2, "%": 2 },
      "font-weight": { "bold": 2, "normal": 2 },
      "font-style": { "italic": 2, "normal": 2 },
      "font-variant": { "normal": 2, "small-caps": 2 },
      "font": 1,
      "height": { "px": 2, "em": 2, "%": 2 },
      "left": { "px": 2, "em": 2, "%": 2 },
      "letter-spacing": { "normal": 2 },
      "line-height": { "normal": 2 },
      "list-style": 1,
      "list-style-image": 1,
      "list-style-position": 1,
      "list-style-type": { "none": 2, "disc": 2, "circle": 2, "square": 2, "decimal": 2, "decimal-leading-zero": 2, "lower-roman": 2, "upper-roman": 2, "lower-greek": 2, "lower-latin": 2, "upper-latin": 2, "georgian": 2, "lower-alpha": 2, "upper-alpha": 2 },
      "margin": { "px": 2, "em": 2, "%": 2 },
      "margin-right": { "px": 2, "em": 2, "%": 2 },
      "margin-left": { "px": 2, "em": 2, "%": 2 },
      "margin-top": { "px": 2, "em": 2, "%": 2 },
      "margin-bottom": { "px": 2, "em": 2, "%": 2 },
      "max-height": { "px": 2, "em": 2, "%": 2 },
      "max-width": { "px": 2, "em": 2, "%": 2 },
      "min-height": { "px": 2, "em": 2, "%": 2 },
      "min-width": { "px": 2, "em": 2, "%": 2 },
      "outline": 1,
      "outline-color": 1,
      "outline-style": 1,
      "outline-width": 1,
      "overflow": { "hidden": 2, "visible": 2, "auto": 2, "scroll": 2 },
      "overflow-x": { "hidden": 2, "visible": 2, "auto": 2, "scroll": 2 },
      "overflow-y": { "hidden": 2, "visible": 2, "auto": 2, "scroll": 2 },
      "padding": { "px": 2, "em": 2, "%": 2 },
      "padding-top": { "px": 2, "em": 2, "%": 2 },
      "padding-right": { "px": 2, "em": 2, "%": 2 },
      "padding-bottom": { "px": 2, "em": 2, "%": 2 },
      "padding-left": { "px": 2, "em": 2, "%": 2 },
      "page-break-after": { "auto": 2, "always": 2, "avoid": 2, "left": 2, "right": 2 },
      "page-break-before": { "auto": 2, "always": 2, "avoid": 2, "left": 2, "right": 2 },
      "page-break-inside": 1,
      "position": { "absolute": 2, "relative": 2, "fixed": 2, "static": 2 },
      "right": { "px": 2, "em": 2, "%": 2 },
      "table-layout": { "fixed": 2, "auto": 2 },
      "text-decoration": { "none": 2, "underline": 2, "line-through": 2, "blink": 2 },
      "text-align": { "left": 2, "right": 2, "center": 2, "justify": 2 },
      "text-indent": 1,
      "text-transform": { "capitalize": 2, "uppercase": 2, "lowercase": 2, "none": 2 },
      "top": { "px": 2, "em": 2, "%": 2 },
      "vertical-align": { "top": 2, "bottom": 2 },
      "visibility": { "hidden": 2, "visible": 2 },
      "white-space": { "nowrap": 2, "normal": 2, "pre": 2, "pre-line": 2, "pre-wrap": 2 },
      "width": { "px": 2, "em": 2, "%": 2 },
      "word-spacing": { "normal": 2 },
      "z-index": 1,

      // opacity
      "opacity": 1,
      "opacity": 1,
      "filter": { "alpha(opacity=|100)": 2 },

      "text-shadow": { "|2px 2px 2px #777": 2 },
      "text-overflow": { "ellipsis-word": 2, "clip": 2, "ellipsis": 2 },

      // border radius
      "border-radius": 1,
      "-moz-border-radius": 1,
      "-moz-border-radius-topright": 1,
      "-moz-border-radius-bottomright": 1,
      "-moz-border-radius-topleft": 1,
      "-moz-border-radius-bottomleft": 1,
      "-webkit-border-radius": 1,
      "-webkit-border-top-right-radius": 1,
      "-webkit-border-top-left-radius": 1,
      "-webkit-border-bottom-right-radius": 1,
      "-webkit-border-bottom-left-radius": 1,

      // dropshadows
      "-moz-box-shadow": 1,
      "-webkit-box-shadow": 1,

      // transformations
      "transform": { "rotate(|0deg)": 2, "skew(|0deg)": 2 },
      "-moz-transform": { "rotate(|0deg)": 2, "skew(|0deg)": 2 },
      "-webkit-transform": { "rotate(|0deg)": 2, "skew(|0deg)": 2 }
    };

    // tags = 1, attributes = 2, values = 3
    this.xmlDictionary =
    {
      // tags should return 1
      "html": 1,
      "head": 1,

      // but if they have some attributes to suggest, they don't need to return 1
      // and simply return an object with those attributes, returning 2
      "link": {
        // however, this attribute wants to return values, so again it returns an
        // object, containing values that are marked as 3
        "type": { "text/css": 3, "image/png": 3, "image/jpeg": 3, "image/gif": 3 },
        "rel": { "stylesheet": 3, "icon": 3 },
        "href": 2,
        "media": { "all": 3, "screen": 3, "print": 3 }
      },
      "script": {
        "type": { "text/javascript": 3 },
        "src": 2
      },
      "title": 1,
      "style": {
        "type": { "text/css": 3 },
        "media": { "all": 3, "screen": 3, "print": 3 }
      },
      "meta": {
        "name": { "description": 3, "keywords": 3 },
        "content": { "text/html; charset=UTF-8": 3 },
        "http-equiv": { "content-type": 3 }
      },
      // body returns all common attributes, but shows "onload" as first suggestion
      "body": csccSense.commonAttributes({
        "onload": 2
      }),
      "a": csccSense.commonAttributes({
        "href": 2,
        "target": { "_blank": 3, "top": 3 }
      }),
      "img": csccSense.commonAttributes({
        "src": 2,
        "alt": 2,
        "width": 2,
        "height": 2
      }),
      "form": csccSense.commonAttributes({
        "method": { "get": 3, "post": 3 },
        "action": 2,
        "enctype": { "multipart/form-data": 3, "application/x-www-form-urlencoded": 3 },
        "onsubmit": 2
      }),
      "input": csccSense.commonAttributes({
        "type": { "text": 3, "password": 3, "hidden": 3, "checkbox": 3, "submit": 3, "radio": 3, "file": 3, "button": 3, "reset": 3, "image": 3 },
        "name": 2,
        "value": 2,
        "checked": { "checked": 3 },
        "maxlength": 2,
        "disabled": { "disabled": 3 },
        "readonly": { "readonly": 3 }
      }),
      "select": csccSense.commonAttributes({
        "name": 2,
        "size": 2,
        "multiple": { "multiple": 3 },
        "disabled": { "disabled": 3 },
        "readonly": { "readonly": 3 }
      }),
      "option": {
        "value": 2,
        "selected": { "selected": 3 }
      },
      "optgroup": {
        "label": 2
      },
      "label": csccSense.commonAttributes({
        "for": 2
      }),
      "textarea": csccSense.commonAttributes({
        "name": 2, "cols": 2, "rows": 2,
        "wrap": { "on": 3, "off": 3 },
        "disabled": { "disabled": 3 },
        "readonly": { "readonly": 3 }
      }),
      "button": csccSense.commonAttributes({
        "onclick": 2
      }),
      "table": csccSense.commonAttributes({
        "border": { "0": 3 },
        "cellpadding": { "0": 3 },
        "cellspacing": { "0": 3 },
        "width": 2, "height": 2,
        "summary": 2
      }),
      "td": csccSense.commonAttributes({
        "colspan": 2,
        "rowspan": 2,
        "width": 2,
        "height": 2,
        "valign": { "top": 3, "bottom": 3, "baseline": 3, "middle": 3 }
      }),
      "iframe": this.commonAttributes({
        "src": 2,
        "frameborder": { "0": 3 }
      })
    };

    // add the common elements to the dictionary
    for (var i = 0; i < this.commonElements.length; i++)
      this.xmlDictionary[this.commonElements[i]] = this.commonAttributes();
  }
};