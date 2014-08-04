module.exports = {
  document: [
    'USAGE: quit [expression]',
    '',
    'quits the debugger and if an expression is supplied returns the evaluated expression as a status code'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      if (!remaining_line) {
        command_mode.debugger_instance.close(0);
      }
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
        command_mode.debugger_instance.close(msg.body.body.value);
        //callback(null);
      });
  }
}