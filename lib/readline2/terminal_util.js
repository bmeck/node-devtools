var metaKeyCodeReAnywhere = /(?:\x1b)([a-zA-Z0-9])/;
var metaKeyCodeRe = new RegExp('^' + metaKeyCodeReAnywhere.source + '$');
var functionKeyCodeReAnywhere =
    /(?:\x1b+)(O|N|\[|\[\[)(?:((?:\d+)(?:;(?:\d+))*)([~^$R])|(?:1;)?(\d+)?([a-zA-Z]))/;
var functionKeyCodeRe = new RegExp('^' + functionKeyCodeReAnywhere.source);

/**
 * clears the screen from the current position of the cursor down
 */

function clearScreenDown(stream) {
  stream.write('\x1b[0J');
}
exports.clearScreenDown = clearScreenDown;

/**
 * Returns the Unicode code point for the character at the
 * given index in the given string. Similar to String.charCodeAt(),
 * but this function handles surrogates (code point >= 0x10000).
 */

function codePointAt(str, index) {
  var code = str.charCodeAt(index);
  var low;
  if (0xd800 <= code && code <= 0xdbff) { // High surrogate
    low = str.charCodeAt(index + 1);
    if (!isNaN(low)) {
      code = 0x10000 + (code - 0xd800) * 0x400 + (low - 0xdc00);
    }
  }
  return code;
}
exports.codePointAt = codePointAt;

function moveCursorAbsolute(stream, x, y) {
  if (typeof x !== 'number' && typeof y !== 'number')
    return;

  if (typeof x !== 'number')
    throw new Error("Can't set cursor row without also setting it's column");

  if (typeof y !== 'number') {
    stream.write('\x1b[' + (x + 1) + 'G');
  } else {
    stream.write('\x1b[' + (y + 1) + ';' + (x + 1) + 'H');
  }
}
exports.moveCursorAbsolute = moveCursorAbsolute;


/**
 * moves the cursor relative to its current location
 */

function moveCursorRelative(stream, dx, dy) {
  if (dx < 0) {
    stream.write('\x1b[' + (-dx) + 'D');
  } else if (dx > 0) {
    stream.write('\x1b[' + dx + 'C');
  }

  if (dy < 0) {
    stream.write('\x1b[' + (-dy) + 'A');
  } else if (dy > 0) {
    stream.write('\x1b[' + dy + 'B');
  }
}
exports.moveCursorRelative = moveCursorRelative;

function clearScreenDown(stream) {
  stream.write('\x1b[0J');
}
exports.clearScreenDown = clearScreenDown;

function clearLineToBeginning(stream, dir) {
  stream.write('\x1b[1K');
}
exports.clearLineToBeginning = clearLineToBeginning;
function clearLineToEnd(stream) {
  stream.write('\x1b[0K');
}
exports.clearLineToEnd = clearLineToEnd;
function clearLineEntirely(stream) {
  stream.write('\x1b[2K');
}
exports.clearLineEntirely = clearLineEntirely;

exports.sequenceToKeys = function sequenceToKeys(buff) {
  
  var s;
  if (buff[0] > 127 && buff.length === 1) {
    var tmp_buff = new Buffer(s);
    tmp_buff[0] -= 128;
    s = '\x1b' + tmp_buff.toString('utf-8');
  } else {
    s = buff.toString('utf-8');
  }
  
  var pattern = new RegExp(functionKeyCodeReAnywhere.source + '|' + metaKeyCodeReAnywhere.source + '|[\\s\\S]', 'g');
  var match = pattern.exec(s);
  var result = [];
  while (match) {
    console.log(match)
    result[result.length] = subsequenceToKey(match[0], buff);
    match = pattern.exec(s);
  }
  return result;
}

function subsequenceToKey(s, buff) {
  var ch,
      parts;

  var name  = undefined;
  var ctrl  = false;
  var meta  = false;
  var shift = false;

  if (s === '\r') {
    // carriage return
    name = 'return';

  } else if (s === '\n') {
    // enter, should have been called linefeed
    name = 'enter';

  } else if (s === '\t') {
    // tab
    name = 'tab';

  } else if (s === '\b' || s === '\x7f' ||
             s === '\x1b\x7f' || s === '\x1b\b') {
    // backspace or ctrl+h
    name = 'backspace';
    meta = (s.charAt(0) === '\x1b');

  } else if (s === '\x1b' || s === '\x1b\x1b') {
    // escape key
    name = 'escape';
    meta = (s.length === 2);

  } else if (s === ' ' || s === '\x1b ') {
    name = 'space';
    meta = (s.length === 2);

  } else if (s.length === 1 && s <= '\x1a') {
    // ctrl+letter
    name = String.fromCharCode(s.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
    ctrl = true;

  } else if (s.length === 1 && s >= 'a' && s <= 'z') {
    // lowercase letter
    name = s;

  } else if (s.length === 1 && s >= 'A' && s <= 'Z') {
    // shift+letter
    name = s.toLowerCase();
    shift = true;

  } else if (parts = metaKeyCodeRe.exec(s)) {
    // meta+character key
    name = parts[1].toLowerCase();
    meta = true;
    shift = /^[A-Z]$/.test(parts[1]);

  } else if (parts = functionKeyCodeRe.exec(s)) {
    // ansi escape sequence

    // reassemble the key code leaving out leading \x1b's,
    // the modifier key bitflag and any meaningless "1;" sequence
    var code = (parts[1] || '') +
               (parts[3] || '') + (parts[5] || ''),
        modifier = (parts[2] || parts[4] || 1) - 1;

    // Parse the key modifier
    ctrl = !!(modifier & 4);
    meta = !!(modifier & 10);
    shift = !!(modifier & 1);
    code = code;

    // Parse the key itself
    switch (code) {
      /* xterm/gnome ESC O letter */
      case 'OP': name = 'f1'; break;
      case 'OQ': name = 'f2'; break;
      case 'OR': name = 'f3'; break;
      case 'OS': name = 'f4'; break;

      /* xterm/rxvt ESC [ number ~ */
      case '[11~': name = 'f1'; break;
      case '[12~': name = 'f2'; break;
      case '[13~': name = 'f3'; break;
      case '[14~': name = 'f4'; break;

      /* from Cygwin and used in libuv */
      case '[[A': name = 'f1'; break;
      case '[[B': name = 'f2'; break;
      case '[[C': name = 'f3'; break;
      case '[[D': name = 'f4'; break;
      case '[[E': name = 'f5'; break;

      /* common */
      case '[15~': name = 'f5'; break;
      case '[17~': name = 'f6'; break;
      case '[18~': name = 'f7'; break;
      case '[19~': name = 'f8'; break;
      case '[20~': name = 'f9'; break;
      case '[21~': name = 'f10'; break;
      case '[23~': name = 'f11'; break;
      case '[24~': name = 'f12'; break;

      /* xterm ESC [ letter */
      case '[A': name = 'up'; break;
      case '[B': name = 'down'; break;
      case '[C': name = 'right'; break;
      case '[D': name = 'left'; break;
      case '[E': name = 'clear'; break;
      case '[F': name = 'end'; break;
      case '[H': name = 'home'; break;

      /* xterm/gnome ESC O letter */
      case 'OA': name = 'up'; break;
      case 'OB': name = 'down'; break;
      case 'OC': name = 'right'; break;
      case 'OD': name = 'left'; break;
      case 'OE': name = 'clear'; break;
      case 'OF': name = 'end'; break;
      case 'OH': name = 'home'; break;

      /* xterm/rxvt ESC [ number ~ */
      case '[1~': name = 'home'; break;
      case '[2~': name = 'insert'; break;
      case '[3~': name = 'delete'; break;
      case '[4~': name = 'end'; break;
      case '[5~': name = 'pageup'; break;
      case '[6~': name = 'pagedown'; break;

      /* putty */
      case '[[5~': name = 'pageup'; break;
      case '[[6~': name = 'pagedown'; break;

      /* rxvt */
      case '[7~': name = 'home'; break;
      case '[8~': name = 'end'; break;

      /* rxvt keys with modifiers */
      case '[a': name = 'up'; shift = true; break;
      case '[b': name = 'down'; shift = true; break;
      case '[c': name = 'right'; shift = true; break;
      case '[d': name = 'left'; shift = true; break;
      case '[e': name = 'clear'; shift = true; break;

      case '[2$': name = 'insert'; shift = true; break;
      case '[3$': name = 'delete'; shift = true; break;
      case '[5$': name = 'pageup'; shift = true; break;
      case '[6$': name = 'pagedown'; shift = true; break;
      case '[7$': name = 'home'; shift = true; break;
      case '[8$': name = 'end'; shift = true; break;

      case 'Oa': name = 'up'; ctrl = true; break;
      case 'Ob': name = 'down'; ctrl = true; break;
      case 'Oc': name = 'right'; ctrl = true; break;
      case 'Od': name = 'left'; ctrl = true; break;
      case 'Oe': name = 'clear'; ctrl = true; break;

      case '[2^': name = 'insert'; ctrl = true; break;
      case '[3^': name = 'delete'; ctrl = true; break;
      case '[5^': name = 'pageup'; ctrl = true; break;
      case '[6^': name = 'pagedown'; ctrl = true; break;
      case '[7^': name = 'home'; ctrl = true; break;
      case '[8^': name = 'end'; ctrl = true; break;

      /* misc. */
      case '[Z': name = 'tab'; shift = true; break;
      default: name = 'undefined'; break;

    }
  }

  return {
    name: name,
    ctrl: ctrl,
    shift: shift,
    meta: meta,
    sequence: s,
    buffer: buff
  };
}
exports.subsequenceToKey = subsequenceToKey;

function stripVTControlCharacters(str) {
  str = str.replace(new RegExp(functionKeyCodeReAnywhere.source, 'g'), '');
  return str.replace(new RegExp(metaKeyCodeReAnywhere.source, 'g'),  '');
}
exports.stripVTControlCharacters = stripVTControlCharacters;

function measureText(str) {
  var width = 0;
  str = stripVTControlCharacters(str);
  for (var i = 0, len = str.length; i < len; i++) {
    var code = codePointAt(str, i);
    if (code >= 0x10000) { // surrogates
      i++;
    }
    if (isCharCodeFullWidth(code)) {
      width += 2;
    } else {
      width++;
    }
  }
  return width;
}
exports.measureText = measureText;

function isCharCodeFullWidth(code) {
  if (isNaN(code)) {
    return false;
  }

  // Code points are derived from:
  // http://www.unicode.org/Public/UNIDATA/EastAsianWidth.txt
  if (code >= 0x1100 && (
      code <= 0x115f ||  // Hangul Jamo
      0x2329 === code || // LEFT-POINTING ANGLE BRACKET
      0x232a === code || // RIGHT-POINTING ANGLE BRACKET
      // CJK Radicals Supplement .. Enclosed CJK Letters and Months
      (0x2e80 <= code && code <= 0x3247 && code !== 0x303f) ||
      // Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
      0x3250 <= code && code <= 0x4dbf ||
      // CJK Unified Ideographs .. Yi Radicals
      0x4e00 <= code && code <= 0xa4c6 ||
      // Hangul Jamo Extended-A
      0xa960 <= code && code <= 0xa97c ||
      // Hangul Syllables
      0xac00 <= code && code <= 0xd7a3 ||
      // CJK Compatibility Ideographs
      0xf900 <= code && code <= 0xfaff ||
      // Vertical Forms
      0xfe10 <= code && code <= 0xfe19 ||
      // CJK Compatibility Forms .. Small Form Variants
      0xfe30 <= code && code <= 0xfe6b ||
      // Halfwidth and Fullwidth Forms
      0xff01 <= code && code <= 0xff60 ||
      0xffe0 <= code && code <= 0xffe6 ||
      // Kana Supplement
      0x1b000 <= code && code <= 0x1b001 ||
      // Enclosed Ideographic Supplement
      0x1f200 <= code && code <= 0x1f251 ||
      // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
      0x20000 <= code && code <= 0x3fffd)) {
    return true;
  }
  return false;
}
exports.isCharCodeFullWidth = isCharCodeFullWidth;