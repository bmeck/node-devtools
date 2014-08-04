module.exports = {
  document: [
    'GC: gc',
    '',
    'forces a garbage collection'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var msg = {
        command: 'gc',
        arguments:{
        }
      };
      command_mode.send(null, msg, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }
        command_mode.log('before : %s', msg.body.body.before);
        command_mode.log('after  : %s', msg.body.body.after);
        command_mode.log('diff   : %s', msg.body.body.after - msg.body.body.before);
        command_mode.log('% diff : %s%', ((msg.body.body.before - msg.body.body.after) / msg.body.body.before).toFixed(4) * 100);
        callback(null);
      });
  }
}
