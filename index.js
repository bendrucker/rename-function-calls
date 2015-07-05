'use strict';

var detective = require('detective')
  , patch = require('patch-text')
  , esprimaOpts = { tolerant: true, range: true };

function rangeComparator(a, b) {
  return a.start > b.end ? 1 : -1;
}

function getReplacements(fromName, toName, src) {
  var regex = new RegExp('^' + fromName);
  
  var res = detective.find(src, { word: fromName, nodes: true, parse: esprimaOpts });
  return res.nodes.map(function (n) {
    var c = n.callee;
      var code = src.slice(c.range[0], c.range[1]).replace(regex, toName);
      return { start: c.range[0], end: c.range[1], replacement: code };
  });
}

var go = module.exports = 

/**
 * Replaces every function call named `from` with another one that is named `to`.
 *
 * #### Example
 *
 *    rename(src, 'log', 'print');
 *    // => log(x) becomes print(x)
 *
 * @name rename
 * @function
 * @param {string} origSrc the original source
 * @param {string} fromName name under which function is currently called
 * @param {string} toName name to which the function calls should be renamed
 * @return {string} source with function calls renamed
 */
function rename(fromName, toName, origSrc) {
  var src = origSrc;

  // ensure that at least one of the function call statements we want to replace is in the code
  // before we perform the expensive operation of finding them by creating an AST
  var regex = new RegExp(fromName + ' *\\(.*\\)');
  if (!regex.test(src)) return src
    
  // we need to remove hashbang BEFORE feeding src into detective, since if the latter replaces it our ranges are off
  // we are assuming that the hashbang is on the first line - if not this breaks horribly
  var hb = src.match(/^#![^\n]*\n/);
  var hbs = hb ? hb[0] : '';
  if (hb) src = src.slice(hbs.length);
  
  var offset = 0;
  return hbs + patch(src, getReplacements(fromName, toName, src).sort(rangeComparator));
}
