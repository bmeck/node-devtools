var ConsolePoint = require('./console_point');
function Prompt(console, origin) {
  this._console = console;
  this._origin = origin;
  this._lines = [];
  this._selectionStart = new ConsolePoint(0,0);
  this._selectionEnd = new ConsolePoint(0,0);
  
  var self = this;
  this._console.on('key', function (key) {
    self.processKey(key);
  });
  return this;
}
module.exports = Prompt;

Prompt.prototype.processKey = function (key) {
  if (key.name === 'c' && key.ctrl) this._console.end();
  else {
    this._console.write(key.sequence);
  }
}

Prompt.prototype.insert = function () {
  var row = this._selectionStart.row;
  var col = this._selectionStart.col;
}
Prompt.prototype.remove = function () {
  this._lines = this._selectionStart();
}
Prompt.prototype.end = function () {
  ;
}