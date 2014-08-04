var BaseMode = require('./_base');
var util = require('util');
var tty = require('tty');
var readline = require('readline');
function ReadlineMode(debugger_instance) {
  BaseMode.call(this, debugger_instance);
  var self = this;
  this._interface = readline.createInterface({
    input: debugger_instance.input,
    output: debugger_instance.output,
    completer: function (line, callback) {
      self.completer(line, callback);
    },
    terminal: debugger_instance.input instanceof tty.ReadStream
  });
  this._interface.setPrompt(this.name+'> ');
  this._interface.on('line', function (line) {
    if (self._delegates.length) {
      self._delegates[self._delegates.length-1](line);
      return;
    }
    self.consume(line, function (err) {
      if (err) {
        self.log('Error: %s', err.message);
      }
      self.prompt(false);
    });
  })
  this._interface.prompt(false);
  this._delegates = [];
  return this;
}
module.exports = ReadlineMode;
util.inherits(ReadlineMode, BaseMode);

ReadlineMode.prototype.name = '';
ReadlineMode.prototype.prompt = function (preserve) {
  this._interface.prompt(preserve);
}
ReadlineMode.prototype.delegate = function (handler) {
  var self = this;
  function undelegate() {
    if (self._delegates[self._delegates.length - 1] === handler) {
      self._delegates = self._delegates.slice(0, -1);
      self.prompt(false);
    }
    else {
      throw new Error('Not currently the delegate');
    }
  };
  this._delegates.push(handler);
  return undelegate;
}
ReadlineMode.prototype.completer = function (line, callback) {
  callback(null, [[], line]);
}
ReadlineMode.prototype.consume = function (line, callback) {
  callback(null);
}
ReadlineMode.prototype.close = function () {
  this._interface.close();
  this._interface = null;
}