var pad = require('pad');
module.exports = {
  document: [
    'SOURCE: source id',
    '',
    'prints the entire source of files matching the pattern or id'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var msg = {
        command: 'scripts',
        arguments:{
          types: 0x0f,
          includeSource: true,
          ids: [+remaining_line]
        }
      };
      command_mode.send(null, msg, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }
        msg.body.body.sort(function (a, b) {
          return a.name < b.name ? -1 : 1;
        }).forEach(function (script) {
          var line = 1;
          var size = Math.ceil(Math.log(script.lineCount) / Math.log(10));
          command_mode.log(script.source.replace(/^/gm, function () {
            return pad(String(line++), size) +': ';
          }));
        });
        callback(null);
      });
  }
}
