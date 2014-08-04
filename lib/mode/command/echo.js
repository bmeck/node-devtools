module.exports = {
  document: [
    'USAGE: echo text',
    '',
    'prints the text provided'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
    command_mode.log(remaining_line);
    callback(null);
  }
}