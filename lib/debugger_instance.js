var debug = require('debug')('debug-instance');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
function DebuggerInstance(debugger_bridge, input, output, options) {
  EventEmitter.call(this);
  this.debugger_bridge = debugger_bridge;
  this.input = input;
  this.output = output;
  if (!options) {
    options = {};
  }
  var defaults = DebuggerInstance.defaults;
  this.modes = options.modes || defaults.modes;
  this.setMode(options.mode || defaults.mode);
  return this;
}
util.inherits(DebuggerInstance, EventEmitter);
DebuggerInstance.defaults = {
  modes: {
    command: require('./mode/command'),
    repl: require('./mode/repl')
  },
  mode: 'command'
}
DebuggerInstance.prototype.setMode = function (name) {
  this.modes[name] = new this.modes[name](this);
}
DebuggerInstance.prototype.send = function (headers, message, callback) {
  this.debugger_bridge.send(headers, message, callback);
}
DebuggerInstance.prototype.formatProtocolValue = function (value, prefix) {
  prefix = prefix || '';
  if (Array.isArray(value)) {
    var self = this;
    return value.map(function (value) {
      self.formatProtocolValue(value, '* ' + prefix);
    }).join('\n');
  }
  else if (value.type === 'script') {
    return prefix + value.name;
  }
  else if (value.type === 'object'){
    return prefix + '[' + value.type + ' ' + value.className + ']' + (value.name || value.inferredName || '') + ' {\n' +
      prefix + value.properties.map(function (prop) {
        return '  ' + prop.name
      }).join('\n') + '\n' +
      prefix + '}';
  }
  else if (value.type === 'function') {
    return prefix + value.source;
  }
  else {
    return prefix + JSON.stringify(value.value);
  }
}
DebuggerInstance.prototype.close = function (status) {
  this.emit("close", status);
  this.debugger_bridge.end();
}
DebuggerInstance.prototype.log = function () {
  var self = this;
  var values = [].slice.call(arguments);
  if (typeof values[0] === 'string') {
    var index = 1;
    var str = values[0].replace(/%[sdj]/g, function (type) {
      var ret;
      switch (type) {
        case '%s':
          ret = String(values[index]);
          break;
        case '%d':
          ret = Number(values[index]);
          break;
        case '%j':
          ret = JSON.stringify(values[index]);
          break;
      }
      index++;
      return ret;
    });
    values = [str].concat(values.slice(index));
  }
  this.output.write(values.join(' ')+'\n');
}
module.exports = DebuggerInstance;
