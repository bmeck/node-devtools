var async = require('async');

module.exports = {
  document: [
    'USAGE: blackbox id',
    '',
    '#TODO'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var args = remaining_line.split(/\s+/);
      var id = +args[0];
      command_mode.debugger_instance.breakpoint_info.blackbox_filters.push({
        type: 'scriptId',
        target: id
      });
      callback(null);
  }
}