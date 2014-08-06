var debug = require('debug')('debug-bridge');
var debug_messages = require('debug')('debug-bridge:messages');
var debug_events = require('debug')('debug-bridge:events');
var EventEmitter = require('events').EventEmitter;

function DebuggerBridge(conn, toolname) {
  EventEmitter.call(this);
  this.seq = 1;
  this.conn = conn;
  this.toolname = toolname || "node";
  this.outstanding = {};
  this.state = DebuggerBridge.READING_HEADER;
  this._parser_tmp_buffer = null;
  this._parser_tmp_prev_header = null;
  this._response = null;
  this.on('response', this.onresponse);
  this.conn.on('readable', this.onreadable.bind(this));
  return this;
}
module.exports = DebuggerBridge;
require('util').inherits(DebuggerBridge, EventEmitter);
DebuggerBridge.ERROR                = 0;
DebuggerBridge.READING_HEADER       = 2;
DebuggerBridge.READING_CONTENT      = 4;
DebuggerBridge.prototype.onresponse = function (msg) {
  if (msg.body) {
    var body = msg.body;
    var fn = this.outstanding[body.request_seq]
    if (fn) {
      if (body.success) {
        fn(null, msg);
      }
      else {
        fn(new Error(body.message, msg));
      }
    }
  }
}
DebuggerBridge.prototype.end = function () {
  this.conn.end();
}
DebuggerBridge.prototype.onreadable = function () {
  var unread = this.conn.read();
  if (unread) this._read(unread);
}
DebuggerBridge.prototype._read = function (buff) {
  var state = this.state;
  if (state === DebuggerBridge.ERROR) {
    self.conn.removeListener('readable', this.onreadable);
    return;
  }
  var remaining_buff = this._parser_tmp_buffer ?
    Buffer.concat([this._parser_tmp_buffer, buff]) :
    buff;
  
  while (true) {
    if (this.state === DebuggerBridge.READING_HEADER) {
      var line_and_buff = this._readLine(remaining_buff);
      if (!line_and_buff) {
        break;
      }
      else {
        var line = String(line_and_buff.line);
        remaining_buff = line_and_buff.remaining;
        if (line === '') {
          this.state = DebuggerBridge.READING_CONTENT;
        }
        else if (/^\s/.test(line)) {
          this._response[this._parser_tmp_prev_header] += line.replace(/^\s+/,' ').replace(/\s+$/, '');
        }
        else {
          var index = line.indexOf(':');
          var name = line.substr(0, index).trim().toLowerCase();
          var value = line.substr(index+1).trim();
          this.setupResponse();
          this._response.headers[name] = value;
        }
      }
    }
    else if (this.state === DebuggerBridge.READING_CONTENT) {
      var content_and_buff = this._readNumberOfBytes(remaining_buff, +this._response.headers['content-length']);
      if (!content_and_buff) {
        break;
      }
      else {
        this.state = DebuggerBridge.READING_HEADER;
        
        var content = content_and_buff.content;
        remaining_buff = content_and_buff.remaining;
        
        this.setupResponse();
        if (content.length > 0) {
          try {
            var msg = JSON.parse(String(content));
          }
          catch (e) {
            this.emit('error', e);
            break;
          }
          this._response.body = msg;
        }
        var logger = this._response.type === 'event' ? debug_events : debug_messages;
        // logger('headers', this._response.headers);
        logger('body', this._response.body);
        //console.error(this._response)
        var type = this._response.body && this._response.body.type;
        if (type) this.emit(type, this._response);
        this._response = null;
      }
    }
  }
  
  this._parser_tmp_buffer = remaining_buff;
}
DebuggerBridge.prototype.setupResponse = function () {
  this._response = this._response || {headers:{},body:null};
}
DebuggerBridge.prototype._readLine = function (buff) {
  for (var i = 0; i < buff.length; i++) {
    if (buff[i] === 0x0A) {
      var end = i;
      if (end > 0 && buff[end-1] === 0x0D) end--;
      return {
        line: buff.slice(0, end),
        remaining: buff.slice(i+1, buff.length)
      }
    }
  }
  return null;
}
DebuggerBridge.prototype._readNumberOfBytes = function (buff, length) {
  if (buff.length >= length) {
    return {
      content: buff.slice(0, length),
      remaining: buff.slice(length, buff.length)
    }
  }
  return null;
}
DebuggerBridge.prototype.send = function (headers, msg, cb) {
  var conn = this.conn;
  
  if (headers) for (var k in headers) {
    var v = headers[k];
    if (Array.isArray(v)) {
      v.forEach(function (v) {
        conn.write(k + ': ' + v + '\r\n');
      });
    }
    else {
      conn.write(k + ': ' + v + '\r\n');
    }
  }
  
  var obj = {};
  for (var k in msg) obj[k] = msg[k];
  obj.seq = this.seq++;
  obj.type = 'request';
  
  this.outstanding[obj.seq] = cb;
  
  var str = JSON.stringify(obj);
  conn.write('Tool: '+this.toolname.replace(/[\r\n\v\f\x85\u2028\u2029]/g,'')+'\r\n');
  conn.write('Content-Length: '+str.length+'\r\n\r\n');
  conn.write(str);
  debug('SENDING', str);
}
