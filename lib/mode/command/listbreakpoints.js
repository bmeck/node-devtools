var pad = require('pad');
var async = require('async');
module.exports = {
  document: [
    'USAGE: listbreakpoints',
    '',
    '#TODO'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var msg = {
        command: 'listbreakpoints',
        arguments:{
          type: 'handle',
          target: '_tickCallback',
        }
      };
      command_mode.send(null, msg, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }
        var size = Math.ceil(Math.log(msg.body.body.breakpoints.length) / Math.log(10));
        var brkpts = msg.body.body.breakpoints;
        var breakOnExceptions = msg.body.body.breakOnExceptions;
        var breakOnUncaughtExceptions = msg.body.body.breakOnUncaughtExceptions;
        var needed_script_ids = brkpts.reduce(function (needed, brkpt) {
          if (brkpt.type === 'scriptId') {
            needed.push(brkpt.script_id);
          }
          return needed;
        }, []);
        var scripts_msg = {
          command: 'scripts',
          arguments:{
            types: 0x0f,
            ids: needed_script_ids
          }
        };
        command_mode.send(null, scripts_msg, function (err, msg) {
          if (err) {
            callback(err);
            return;
          }
          var script_cache = {};
          msg.body.body.forEach(function (script) {
            script_cache[script.id] = script.name;
          });
          brkpts.forEach(function (brkpt) {
            console.error(brkpt)
            var active = brkpt.active ? '+' : '-';
            var id = pad(String(brkpt.number), size);
            var name = brkpt.type === 'scriptId' ? script_cache[brkpt.script_id] : brkpt.script_name;
            command_mode.debugger_instance.log('%s[%s] (%s:%d:%d)', id, active, name, brkpt.line, brkpt.column);
          });
          if (breakOnExceptions) command_mode.debugger_instance.log('Breaking on exceptions');
          if (breakOnUncaughtExceptions) command_mode.debugger_instance.log('Breaking on uncaught exceptions');
          callback(null);
        });
      });
  }
}