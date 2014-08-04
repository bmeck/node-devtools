var tty = require('tty');

function ReadlineInterface() {
  this._prompt = '>';
  return this;
}
ReadlineInterface.prototype.prompt = function (preserve_caret) {
  ;
}