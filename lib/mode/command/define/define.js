module.exports = {
  document: [
    'USAGE: define name',
    '',
    'creates a user defined function'
  ].join('\n'),
  handler: function (command_mode, remaining_line, options, callback) {
    var name = remaining_line;
    if (!name || /[^a-zA-Z0-9_-]/.test(name)) {
      callback(new Error('Invalid command name'));
      return;
    }
    var document = 'USER DEFINED FUNCTION';
    var commands = [];
    var extended_commands = Object.create(command_mode.commands);
    extended_commands.document = require('./define/document');
    extended_commands['if'] = require('./define/if');
    var undelegate = command_mode.delegate(function (line) {
      function interpolate(which, argv) {
        if (which === 'v') {
          return argv.join(' ');
        }
        else if (which === 'c') {
          return argv.length+'';
        }
        else {
          return argv[which];
        }
      }
      if (line !== 'end') {
        command_mode.parse(line, extended_commands, function (err, remaining_and_handler) {
          if (err) {
            callback(err);
            return;
          }
          var constant_parts = [];
          var dynamic_parts = [];
          var interpolation_matcher = /[$]arg(\d+|[vc])/g;
          var match = interpolation_matcher.exec(remaining_and_handler.remaining);
          var index = 0;
          while (match) {
            constant_parts.push(remaining_and_handler.remaining.slice(index, match.index));
            dynamic_parts.push(match[1]);
            index = interpolation_matcher.lastIndex;
            match = interpolation_matcher.exec(remaining_and_handler.remaining);
          }
          constant_parts.push(remaining_and_handler.remaining.slice(index));
          commands.push(function (command_mode, options, callback) {
            var line = dynamic_parts.map(function(arg_n, i){
              return constant_parts[i] + interpolate(arg_n, options.argv);
            }).join('')+ constant_parts[constant_parts.length -1];
            remaining_and_handler.handler(command_mode, line, options, callback);
          });
        });
        command_mode.prompt(false);
      }
      else {
        command_mode.commands[name] = {
          document: document,
          handler: function (command_mode, remaining_line, options, callback) {
            var args = [];
            var matcher = /\S+|"(\\.|[^"])*"|'(\\.|[^'])*'/g;
            var interpolation_matcher = /[$]arg(\d+|[vc])/g;
            var match = matcher.exec(remaining_line);
            while (match) {
              // "token"
              if (match[1]) {
                // TODO: variable subsitution?
                args.push(JSON.parse(match[2]).replace(interpolation_matcher, function (_, arg_n) {
                  if (!options.argv) {
                    return _;
                  }
                  return interpolate(arg_n, options.argv);
                }));
              }
              // 'token'
              else if (match[2]) {
                args.push(JSON.parse(match[2]));
              }
              // token
              else {
                if (options.argv && match[0].length === interpolation_matcher.lastIndex - match.index) {
                  args.push(interpolate(arg_n, options.argv));
                }
                else {
                  args.push(match[0]);
                }
              }
              match = matcher.exec(remaining_line);
            }
            var index = 0;
            var done = false;
            function next(err) {
              if (done) {
                return;
              }
              if (err || index >= commands.length) {
                done = true;
                callback(err);
                return;
              }
              var command = commands[index];
              index++;
              command(command_mode, {argv: args}, next);
            }
            next();
          }
        }
        undelegate();
      }
    });
    command_mode.prompt(false);
  }
}