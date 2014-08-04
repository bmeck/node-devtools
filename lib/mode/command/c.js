module.exports = {
  document: [
    'USAGE: c type',
    '',
    'continues execution'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var args = {};
      remaining_line = remaining_line.trim();
      if (remaining_line) {
        args.stepaction = remaining_line;
      }
      var msg = {
        command:'continue',
        arguments: args
      };
      command_mode.send(null, msg, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }
        var body = msg.body;
        command_mode.log('VM is'+(body.running?' not':'')+' running');
        callback(null);
      });
  }
}
