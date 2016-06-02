var util = require('util')
    ,FSM = require('./lib/fsm').FSM;

module.exports = GameSubscribeSession;

function GameSubscribeSession(options) {
  FSM.call(this, 'INIT');

  this._option = options || {};

  this.addState({state: '*',                   symbol: 'DEBUG',                 next: null, action: this.doShowDebug})
      .addState({state: '*',                   symbol: 'HELP',                  next: null, action: this.doShowHelp})
      // .addState({state: '*',                   symbol: 'QUIT',                  next: null, action: this.doQuit})
      .addState({state: 'INIT',                symbol: '*',                     next: 'INIT', action: this.doParamsRequest})
      .addState({state: 'INIT',                symbol: 'VALID_PARAMS',          next: 'SESSION_STARTED', action: this.doStartSession})
      .addState({state: 'SESSION_STARTED',     symbol: '*',                     next: 'SESSION_STARTED'})
      .addState({state: 'SESSION_STARTED',     symbol: 'SET_RECEIVER_PARAMS_P', next: 'SESSION_STARTED', action: this.doSetReceiverParams})
      .addState({state: 'SESSION_STARTED',     symbol: 'SET_RECEIVER_PARAMS',   next: 'REQ_RECEIVER_PARAMS', action: this.doParamsRequest})
      .addState({state: 'SESSION_STARTED',     symbol: 'START',                 next: 'RECEIVING_GE', action: this.doStartGameReceiver})
      // .addState({state: 'SESSION_STARTED',     symbol: 'START',                 next: 'RECEIVING_GE', action: this.doStartGameReceiver})
      .addState({state: 'RECEIVING_GE',        symbol: 'GAME_EVENT',            next: 'RECEIVING_GE', action: this.doProcessGameEvent})
      .addState({state: 'RECEIVING_GE',        symbol: '*',                     next: 'RECEIVING_GE'})
      .addState({state: 'RECEIVING_GE',        symbol: 'STOP',                  next: 'SESSION_STARTED', action: this.doStopGameReceiver})
      .addState({state: 'RECEIVING_GE',        symbol: 'CHANGE_PARAMS',         next: 'SESSION_STARTED', action: this.doPauseGameReceiver})
      .addState({state: 'REQ_RECEIVER_PARAMS', symbol: '*',                     next: 'REQ_RECEIVER_PARAMS', action: this.doParamsRequest})
      .addState({state: 'REQ_RECEIVER_PARAMS', symbol: 'VALID_PARAMS',          next: 'SESSION_STARTED', action: this.doSetReceiverParams})

  this.state_normalize = {
    'INIT': (rawSymbol, defaultSymbol) => { return defaultSymbol; },
    'REQ_RECEIVER_PARAMS': (rawSymbol, defaultSymbol) => { return defaultSymbol; }
  };

  return this;
};
util.inherits(GameSubscribeSession, FSM);

GameSubscribeSession.prototype.doShowDebug = function () {};
GameSubscribeSession.prototype.doShowHelp = function () {};
GameSubscribeSession.prototype.doParamsRequest = function () {};
GameSubscribeSession.prototype.doStartSession = function () {};
GameSubscribeSession.prototype.doSetReceiverParams = function () {};
GameSubscribeSession.prototype.doStartGameReceiver = function () {};
GameSubscribeSession.prototype.doProcessGameEvent = function () {};
GameSubscribeSession.prototype.doStopGameReceiver = function () {};
GameSubscribeSession.prototype.doPauseGameReceiver = function () {};
GameSubscribeSession.prototype.doQuit = function () {
  this.emit('quit', this);
};

GameSubscribeSession.prototype.normalize = function (symbol) {
  var ret = {
    symbol : '*',
    data   : symbol,
    raw    : symbol
  };

  var state_normalize = this.state_normalize[this.CURRENT_STATE];
  if(!!state_normalize && (state_normalize instanceof Function)){
    ret = state_normalize.call(this, symbol, ret);
  };


  var match = symbol.match(/^(\S+) ?(.*)$/);
  if(!!match && (ret.symbol === '*')){
    ret.symbol = match[1].toUpperCase();
    ret.data   = match[2];
  }

  return ret;
};

GameSubscribeSession.prototype.process = function () {
  this.emit('process', util.inspect(arguments))
  FSM.prototype.process.apply(this, arguments);
  console.log('GameSubscribeSession.process done: '+util.inspect(arguments));
};
