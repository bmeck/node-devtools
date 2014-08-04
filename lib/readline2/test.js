var Console = require('./console');

var c = new Console(process.stdin);
c.enableFocusEvents();
//c.enableMouseEvents();
c.createPrompt(function (err, prompt) {
  if (err) {
    console.error(err);
    process.exit(1);
    return;
  }
  prompt.insert('test this out')
});
//c._stream.write('test this\x1b[99;0;1;1;2;2i out')//\x1b[?1003;1004;1006h');
