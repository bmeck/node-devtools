var ReadlineMode = require('./_readline');
var util = require('util');
function CommandMode(debugger_instance, commands) {
  ReadlineMode.call(this, debugger_instance);
  this.commands = commands || CommandMode.defaults.commands;
  this.vars = {};
  this._prev_line;
  return this;
}
module.exports = CommandMode;
util.inherits(CommandMode, ReadlineMode);

CommandMode.defaults = {
  commands: {
    blackbox: require('./command/blackbox'),
    "break": require('./command/break'),
    bt: require('./command/bt'),
    c: require('./command/c'),
    "continue": require('./command/c'),
    flag: require('./command/flag'),
    print: require('./command/print'),
    define: require('./command/define'),
    echo: require('./command/echo'),
    help: require('./command/help'),
    quit: require('./command/quit'),
    scripts: require('./command/scripts'),
    source: require('./command/source'),
    gc: require('./command/gc'),
    setbreakpoint: require('./command/setbreakpoint'),
    listbreakpoints: require('./command/listbreakpoints'),
  }
}

CommandMode.prototype.name = 'cmd';
CommandMode.prototype.consume = function (line, callback) {
  var self = this;
  if (!line) {
    line = this._prev_line;
  }
  if (!line) {
    consume(null);
    return;
  }
  this._prev_line = line;
  this.parse(line, this.commands, function (err, remaining_and_handler) {
    if (err) {
      callback(err);
      return;
    }
    remaining_and_handler.handler(self, remaining_and_handler.remaining, {argv:[]}, callback);
  });
}
CommandMode.prototype.parse = function (line, commands, callback) {
  var command_and_remaining = line.match(/^(\S*)(?:\s+([\s\S]+))?$/);
  if (!commands || !command_and_remaining) {
    if (callback) callback(new Error('Unable to parse command for ' + JSON.stringify(line)));
    return;
  }
  var commandName = command_and_remaining[1];
  var remaining = command_and_remaining[2];
  var command = commands[commandName];
  if (!command) {
    if (callback) callback(new Error('Unable to find command for ' + JSON.stringify(line)));
    return;
  }
  remaining = remaining || '';
  remaining = remaining.trim();
  if (command.handler) {
    var self = this;
    if (callback) callback(null, {
      remaining: remaining,
      handler: function (command_mode, remaining, options, callback) {
        command.handler(command_mode, remaining, options, callback);
      }
    });
  }
  else if (command.commands) {
    this.parse(remaining, command.commands, callback);
  }
  // HOW THE HELL DID YOU GET HERE!?
  else if (callback) callback(null);
}
