var async = require('async');

module.exports = {
  document: [
    'USAGE: setbreakpoint id',
    '',
    '#TODO'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var args = remaining_line.split(/\s+/);
      var msg = {
        command: 'scripts',
        arguments:{
          types: 0x0f,
          includeSource: true,
          ids: [args[0]]
        }
      };
      command_mode.send(null, msg, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }
        async.each(msg.body.body, function (script, cb) {
          async.times(script.lineCount, function (n, cb) {
            var msg = {
              command:'setbreakpoint',
              arguments:{
                type: 'scriptId',
                line: n,
                target: script.id,
              }
            }
            command_mode.send(null, msg, cb);
          }, cb);
        }, callback)
      });
  }
}