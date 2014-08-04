module.exports = {
  document: function (command_mode) {
    return [
      'USAGE: help <command...>',
      '',
      'where commands is one of:',
      Object.keys(command_mode.commands).join(', ')
    ].join('\n')
  },
  handler: function (command_mode, remaining_line, options, callback) {
    var command_list = remaining_line ? remaining_line.split(/\s+/) : [];
    var command_namespace = command_mode;
    function getCommand(command_namespace, command_list, last_document_namespace) {
      if (command_list.length) {
        if (!command_namespace.commands) {
          return last_document_namespace;
        }
        var inner_namespace = command_namespace.commands[command_list[0]];
        if (inner_namespace) {
          var has_document = !!inner_namespace.document;
          var document_namespace = has_document ? inner_namespace : last_document_namespace;
          return getCommand(inner_namespace, command_list.slice(1), document_namespace);
        }
        return null;
      }
      return last_document_namespace;
    }
    var command = getCommand(command_namespace, command_list, this);
    if (!command) {
      callback(new Error('help was unable to find command ' + JSON.stringify(remaining_line)));
      return;
    }
    var documentation = typeof command.document === 'function' ? command.document(command_mode) : command.document;
    command_mode.log(documentation);
    callback(null);
  }
}