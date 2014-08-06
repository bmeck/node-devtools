var async = require('async');

module.exports = {
  document: [
    'USAGE: flag [!+-]id',
    '',
    'Use + or - to set of disable a flag',
    'Use ! to toggle the flag',
    'This will log the state of the flag'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var args = remaining_line.split(/\s+/);
      var parts = /^([!+\-])?([a-zA-Z0-9_\-]+)$/.exec(args[0]);
      if (!parts) {
        callback(new Error('Invalid flag syntax'));
        return;
      }
      var op = parts[1];
      var id = parts[2];
      var val;
      if (op == '+') {
        val = command_mode.debugger_instance.flags[id] = true;
      }
      else if (op == '-') {
        delete command_mode.debugger_instance.flags[id];
        val = false;
      }
      else if (op == '!') {
        val = command_mode.debugger_instance.flags[id] = !Boolean(command_mode.debugger_instance.flags[id]);
      }
      else {
        val = Boolean(command_mode.debugger_instance.flags[id]);
      }
      command_mode.debugger_instance.log((val ? '+' : '-') + id);
      callback(null);
  }
}