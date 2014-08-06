module.exports = {
  document: [
    'USAGE: bt depth',
    '',
    'prints the backtrace of the VM for a specific number of frames'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var args = {};
      if (/^\d+$/.test(remaining_line)) {
        args.toFrame = +remaining_line;
      }
      var req_msg = {
        command:'backtrace',
        arguments: args
      };
      command_mode.send(null, req_msg, function (err, msg) {
        if (err) {
          console.error(req_msg, msg)
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
