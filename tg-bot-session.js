var util = require('util')
    ,FSM = require('./lib/fsm').FSM
    ,FSMUnknownSymbolError = require('./lib/fsm').FSMUnknownSymbolError
    ,GameSubscribeSession = require('./game-subscribe-sess')
    ,validator = require('validator')
    ,ssClient = require('./ss-client');

module.exports = BotSession;

function BotSession(chatId, userId) {
  FSM.call(this, 'INIT');


  this.chatId = chatId;
  this.userId = userId;

  this._game_sessions = {};

  this.addState({state: 'INIT',              symbol: '*',                     next: 'INIT'})
      .addState({state: 'INIT',              symbol: 'START',                 next: 'W_COMMAND', action: this.init})
      .addState({state: 'W_COMMAND',         symbol: '*',                     next: 'W_COMMAND'})
      .addState({state: 'W_COMMAND',         symbol: 'HELP',                  next: 'W_COMMAND', action: this.show_help})
      .addState({state: 'W_COMMAND',         symbol: 'START_TRACKING',        next: 'W_TRACKING_PARAMS', action: this.tracking_params_request})
      // START_TRACKING с параметрами в одной строке
      .addState({state: 'W_COMMAND',         symbol: 'START_TRACKING_P',      next: 'W_COMMAND', action: this.start_tracking})
      .addState({state: 'W_COMMAND',         symbol: 'STOP_TRACKING',         next: 'W_TRACKING_ID', action: this.tracking_id_request})
      // STOP_TRACKING с параметрами в одной строке
      .addState({state: 'W_COMMAND',         symbol: 'STOP_TRACKING_P',       next: 'W_COMMAND', action: this.stop_tracking})
      .addState({state: 'W_COMMAND',         symbol: 'STOP',                  next: 'INIT', action: this.halt})
      .addState({state: 'W_TRACKING_PARAMS', symbol: '*',                     next: 'W_TRACKING_PARAMS', action: this.tracking_params_request})
      .addState({state: 'W_TRACKING_PARAMS', symbol: 'HELP',                  next: 'W_TRACKING_PARAMS', action: this.show_help})
      .addState({state: 'W_TRACKING_PARAMS', symbol: 'STOP',                  next: 'INIT', action: this.halt})
      .addState({state: 'W_TRACKING_PARAMS', symbol: 'VALID_TRACKING_PARAMS', next: 'W_COMMAND', action: this.start_tracking})
      .addState({state: 'W_TRACKING_PARAMS', symbol: 'CANCEL',                next: 'W_COMMAND'})
      .addState({state: 'W_TRACKING_ID',     symbol: '*',                     next: 'W_TRACKING_ID', action: this.tracking_id_request})
      .addState({state: 'W_TRACKING_ID',     symbol: 'TRACKING_ID',           next: 'W_COMMAND', action: this.stop_tracking})
      .addState({state: 'W_TRACKING_ID',     symbol: 'CANCEL',                next: 'W_COMMAND'})
      .addState({state: 'W_TRACKING_ID',     symbol: 'STOP',                  next: 'INIT', action: this.halt})
      .addState({state: '*',                 symbol: 'DEBUG',                 next: null, action: this.doShowCurrentState})

};
// BotSession.prototype = new FSM('INIT');
util.inherits(BotSession, FSM);

BotSession.prototype.normalize = function(symbol){
  var ret = {
    symbol : '*',
    data   : symbol,
    raw    : symbol
  };

  // Зависимые от состояния токены
  if(isValidTrackingParams(symbol || '')){
    ret.symbol = 'VALID_TRACKING_PARAMS';
    ret.data = symbol;
  }


  // Токены, не зависимые от состояния
  var match = symbol.match(/^(\S+) ?(.+)?$/);
  if(!!match && (/^\*$/).test(ret.symbol)){
    ret.symbol = match[1].toUpperCase();
    ret.data   = match[2];
  }

  

  // Токены, зависимы от толькочто найденых символов
  if((ret.symbol === 'START_TRACKING') && (isValidTrackingParams(ret.data))){
    ret.symbol = 'START_TRACKING_P';
  };

  if((ret.symbol === 'STOP_TRACKING') && (isValidTrackingParams(ret.data))){
    ret.symbol = 'STOP_TRACKING_P';
  }

  return ret;
};

BotSession.prototype.doShowCurrentState = function () {

  this.emit('show-state', this);
};

BotSession.prototype.tracking_params_request = function (symbol) {
  // body...
  
  this.emit('tracking-params-request', this);
}

BotSession.prototype.start_tracking = function (symbol) {
  ssClient.getEventId(symbol.data, (err, evId) => {
    if(err){
      this.emit('start-tracking.fail', this);
      this.emit('error', new Error('Не удалось извлеч id игры из "'+symbol.data+'"', this));
      return;
    }
    
    this.geSubscription = new ssClient.GameEventsSubscription(evId);
    
    var self = this;
    this.geSubscription.on('data', function(data){
      self.emit('game-event.data', data, this);
    });
    this.geSubscription.on('error', function(err){
      self.emit('error', err, this);
    })
    this.geSubscription.start();
    // this.emit('start-tracking.done', evId, this);
    return;
  });
};

function isValidTrackingParams(param_str){
  return validator.isURL(param_str || '', {protocols: ['http', 'https'], require_protocol: true});
}
