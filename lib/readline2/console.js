var ttyutil = require('./terminal_util');
var ConsolePoint = require('./console_point');
var Prompt = require('./prompt');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Console(stream) {
  EventEmitter.call(this);
  stream.setRawMode(true);
  this._stream = stream;
  this._cursor_queries = [];
  this._queuedPrompt = false;
  this._prompt = null;
  
  var self = this;
  stream.on('readable', function () {
    var data = stream.read();
    if (!data) {
      return;
    }
    
    var keys = ttyutil.sequenceToKeys(data);
    //process.stdout.write(JSON.stringify(keys)+'\n')
    
    keys.forEach(function (key) {
      console.log(key)
      if (self.handleControlCodes(key)) {
        return;
      }
      self.emit('key', key);
    });
  });
  return this;
}
module.exports = Console;
util.inherits(Console, EventEmitter);
Console.prototype.write = function (str_or_buff, enc) {
  this._stream.write(str_or_buff, enc);
}
Console.prototype.handleControlCodes = function (key) {
  var match;
  var cursorRequestRe = /^(?:\x1b\[\d*[ABCD])+$/;
  if (cursorRequestRe.test(key.sequence)) {
    var cursorRequestIterRe = /(\d*)([ABCD])/g;
    var match = cursorRequestIterRe.exec(key.sequence);
    var x = 0;
    var y = 0;
    while (match) {
      var amount = +(match[1] || 1);
      if (match[2]==='A') {
        y-=amount;
      }
      else if (match[2]==='B') {
        y+=amount;
      }
      else if (match[2]==='C') {
        x+=amount;
      }
      else if (match[2]==='D') {
        x-=amount;
      }
      match = cursorRequestIterRe.exec(key.sequence);
    }
    this.emit('cursor', {
      x: x,
      y: y,
      sequence: key.sequence
    });
    return true;
  }
  var mouseReportRe = /^\x1b\[M/;
  //console.log(key)
  if (mouseReportRe.test(key.sequence)) {
    if (key.sequence.length !== 6) {
      return false;
    }
    var cb = key.buffer[3];
    this.emit('mouse', {
      button: ((cb & 3) + 1) % 4 + (cb & 64 ? 3 : 0),
      press: cb & 3 !== 3,
      shift:  !!(cb & 4),
      meta:   !!(cb & 8),
      ctrl:   !!(cb & 16),
      x: key.buffer[4] - 32,
      y: key.buffer[5] - 32
    });
    return true;
  }
  var mouseSGRReportRe = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])/;
  match = mouseSGRReportRe.exec(key.sequence);
  if (match) {
    var cb = +match[1];
    this.emit('mouse', {
      button: ((cb & 3) + 1) % 4 + (cb & 64 ? 3 : 0),
      press: match[4] === 'M',
      shift:  !!(cb & 4),
      meta:   !!(cb & 8),
      ctrl:   !!(cb & 16),
      x: +match[2],
      y: +match[3]
    });
    return true;
  }
  var cursorReportRe = /^\x1b\[(\d+);(\d+)R$/;
  match = cursorReportRe.exec(key.sequence);
  if (match) {
    var row = +String.fromCharCode(match[1]);
    var col = +String.fromCharCode(match[2]);
    this._cursor_queries.forEach(function (query) {
      query(null, row, col);
    });
    this._cursor_queries = [];
    return true;
  }
  var cursorFocusRe = /^\x1b\[I$/;
  match = cursorReportRe.exec(key.sequence);
  if (match) {
    this.emit('focus');
    return true;
  }
  var cursorBlurRe = /^\x1b\[O$/;
  match = cursorReportRe.exec(key.sequence);
  if (match) {
    this.emit('blur');
    return true;
  }
  return false;
}

Console.prototype.createPrompt = function (reset_cursor, callback) {
  if (this._prompt) {
    if (callback) callback(new Error("Prompt already exists for console"), null);
    return;
  }
  if (this._queuedPrompt) {
    if (callback) callback(new Error("Prompt already queued for console"), null);
    return;
  }
  this._queuedPrompt = true;
  var self = this;
  this.queryCursorPosition(function (err, row, col) {
    self._queuedPrompt = false;
    self._prompt = new Prompt(self, new ConsolePoint(row, col));
    if (!callback) return;
    if (err) {
      callback(err, null);
    }
    callback(null, self._prompt);
  });
}

Console.prototype.end = function () {
  this._stream.setRawMode(false);
  this.disableFocusEvents();
  this.disableMouseEvents();
  this._stream.end('\x1b[?9l\x1b[?1000l\x1b[?1001l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[!p');
}

Console.prototype.queryCursorPosition = function (callback) {
  if (!this._cursor_queries.length) {
    this._stream.write('\x1b[6n');
  }
  this._cursor_queries.push(callback);
}

Console.prototype.enableMouseEvents = function () {
  this._stream.write('\x1b[?1003h\x1b[?1006h\x1b[?1047h');
}
Console.prototype.disableMouseEvents = function () {
  this._stream.write('\x1b[?1003l\x1b[?1006l\x1b[?1047l');
}
Console.prototype.enableFocusEvents = function () {
  this._stream.write('\x1b[?1004h');
}
Console.prototype.disableFocusEvents = function () {
  this._stream.write('\x1b[?1004l');
}
Console.prototype.moveCursorAbsolute = function (x, y) {
  ttyutil.moveCursorAbsolute(this._stream, x, y);
}
Console.prototype.moveCursorRelative = function (x, y) {
  ttyutil.moveCursorRelative(this._stream, x, y);
}
Console.prototype.saveCursor = function () {
  this._stream.write('\x1b7');
}
Console.prototype.restoreCursor = function () {
  this._stream.write('\x1b8');
}

