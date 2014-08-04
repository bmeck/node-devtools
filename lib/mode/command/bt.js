module.exports = {
  document: [
    'USAGE: bt depth',
    '',
    'prints the backtrace of the VM for a specific number of frames'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var msg = {
        command:'backtrace',
        arguments:{
          toFrame: /^\s*$/.test(remaining_line) || 10
        }
      };
      command_mode.send(null, msg, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }
        var body = msg.body;
        if (body.body.totalFrames === 0) {
          command_mode.log('No frames'); 
        }
        else {
          body.body.frames.forEach(function (frame) {
            command_mode.log(frame.text);
          });
        }
        command_mode.log('VM is'+(msg.body.running ? '' : ' not')+' running');
        callback(null);
      });
  }
}
