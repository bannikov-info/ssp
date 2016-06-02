'use strict';
var FSM = require('./lib/fsm').FSM;

module.exports = ChatBot;

function ChatBot() {
  // if(!out || !(out instanceof Function)){
  //   throw "Не указан метоб вывода"
  // }
  //
  // this._out = out;

  // FSM.call(this);

  this.addState({state: 'INIT',    symbol: '*',        next: 'INIT',    action: this.doIntroduce});
  this.addState({state: 'INIT',    symbol: 'LOGIN',    next: 'SESSION', action: this.doLogin});
  this.addState({state: 'INIT',    symbol: 'EXIT',     next: 'INIT',    action: this.doQuit});
  this.addState({state: 'SESSION', symbol: '*',        next: 'SESSION'});
  this.addState({state: 'SESSION', symbol: 'EXIT',     next: 'INIT'});
  this.addState({state: 'SESSION', symbol: 'SAY',      next: 'SESSION', action: this.doSay});
  this.addState({state: 'SESSION', symbol: 'MEMORIZE', next: 'STORE'});
  this.addState({state: 'STORE',   symbol: '*',        next: 'STORE',   action: this.doRemember});
  this.addState({state: 'STORE',   symbol: 'EXIT',     next: 'SESSION'});

  debugger;

  this.session = {};
  this.login = {};

  return this;
};

ChatBot.prototype = new FSM("INIT");

ChatBot.prototype.normalize = function(symbol){
  var ret = {};

  var match = symbol.match(/^(\S+) ?(.*)$/);
  if(!!match){
    ret.symbol = match[1].toUpperCase();
    ret.data   = match[2];
    ret.raw    = symbol;
  }else{
    ret.symbol = '*';
    ret.data   = symbol;
    ret.raw    = symbol;
  };

  return ret;
};

ChatBot.prototype.doIntroduce = function () {
  this.out('Please introduce yourself first!');
  return this;
};

ChatBot.prototype.doLogin = function (symbol) {
  this.out('Welcome, '+symbol.data);
  this.login = symbol.data;
  if(!this.session[this.login]){
    this.session[this.login] = [];
  };

  return this;
};

ChatBot.prototype.doSay = function (symbol) {
  if(this.session[this.login][symbol.data] !== undefined){
    this.out(this.session[this.login][symbol.data]);
  }else{
    this.out('No record');
  }

  return this;
};

ChatBot.prototype.doRemember = function (symbol) {
  this.session[this.login].push(symbol.raw);

  return this;
};

ChatBot.prototype.doQuit = function (symbol) {
  this.out('Bye bye!');

  return this;
};

ChatBot.prototype.out = function (text) {
  if(!!this._outCb && (this._outCb instanceof Function)){
    this._outCb.call(this, text);
  }
}

ChatBot.prototype.process = function (rawSymbol, outCb) {
  this._outCb = outCb;
  FSM.prototype.process.call(this, rawSymbol);

  return this;
}
