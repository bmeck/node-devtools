function BaseMode(debugger_instance) {
  this.debugger_instance = debugger_instance;
  return this;
}
BaseMode.prototype.log = function () {
  return this.debugger_instance.log.apply(this.debugger_instance, arguments);
}
BaseMode.prototype.send = function () {
  return this.debugger_instance.send.apply(this.debugger_instance, arguments);
}
BaseMode.prototype.enter = function (debugger_instance, callback) {
  throw new Error('Not implemented');
}
BaseMode.prototype.leave = function (debugger_instance, callback) {
  throw new Error('Not implemented');
}
module.exports = BaseMode;