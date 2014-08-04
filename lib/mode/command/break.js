module.exports = {
  document: [
    'USAGE: break',
    '',
    'pauses execution'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var msg = {
        command:'break',
        arguments: {
        }
      };
      command_mode.send(null, msg, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }
        var body = msg.body;
        callback(null);
      });
  }
}
