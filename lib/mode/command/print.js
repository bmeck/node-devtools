module.exports = {
  document: [
    'USAGE: print expression',
    '',
    'runs the expression inside the debugger and returns the result'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var msg = {
        command:'evaluate',
        arguments:{
          expression:remaining_line
        }
      };
      command_mode.send(null, msg, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }
        command_mode.log(command_mode.debugger_instance.formatProtocolValue(msg.body.body));
        callback(null);
      });
  }
}
