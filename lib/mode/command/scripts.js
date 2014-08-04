module.exports = {
  document: [
    'SCRIPTS: scripts filter',
    '',
    'finds all scripts named by the filter'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
      var msg = {
        command:'scripts',
        arguments:{
          types: 0x0f,
          filter: remaining_line ? remaining_line : null
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
          command_mode.log("%s id: %d", script.text, script.id);
        });
        callback(null);
      });
  }
}
