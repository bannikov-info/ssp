var EventEmitter = require('eventemitter2').EventEmitter2
    ,util = require('util');
module.exports.FSM = FSM;
module.exports.FSMError = FSMError;
module.exports.FSMUnknownSymbolError = FSMUnknownSymbolError;
module.exports.FSMTransitionHandleError = FSMTransitionHandleError;

// Finite State Machine base class
function FSM(initialState) {
  EventEmitter.call(this, {
    wildcard: true,
    delimeter: '.'
  })

  this.INITIAL_STATE = initialState;
  this.CURRENT_STATE = initialState;
  this.STATES        = {};

  return this;
};
util.inherits(FSM, EventEmitter);

FSM.prototype.setInitialState = function (value) {
  this.INITIAL_STATE = value;
  return this;
};

FSM.prototype.setCurrentState = function (value) {
  this.CURRENT_STATE = value;
  return this;
};

FSM.prototype.getCurrentState = function () {
  return this.CURRENT_STATE;
};

FSM.prototype.reset = function () {
  this.CURRENT_STATE = this.INITIAL_STATE;
  return this;
}

FSM.prototype.addState = function (state) {
  if(Object.keys(this.STATES).indexOf(state.state) < 0){
    this.STATES[state.state] = {};
  };

  this.STATES[state.state][state.symbol] = {
    next: state.next,
    action: state.action
  };

  return this;
};

FSM.prototype.removeState = function (state, symbol) {
  if(Object.keys(this.STATES).indexOf(state) >= 0){
    if(!!symbol){
      delete this.STATES[state][symbol];
    }else{
      delete this.STATES[state];
    };
  }

  return this;
}

// Этот метод должен быть обязательно переопределен в потомках
FSM.prototype.normalize = function (symbol) {
  return {symbol: symbol};
};

FSM.prototype.process = function (rawSymbol) {
  try {
    var state      = this.STATES[this.CURRENT_STATE];
    var rawSymbol = this.normalize(rawSymbol);
    var symbol    = rawSymbol.symbol;
    state.__proto__ = this.STATES['*'];
    var ss = this.CURRENT_STATE;

    // debugger;
    // console.log("Current sate "+this.CURRENT_STATE+', got symbol '+symbol+'\n');
    if((state[symbol] === undefined) && (Object.keys(state).indexOf('*')>=0)){
      // console.log('Unrecognized symbol '+symbol+', using *\n');
      symbol = '*'
      this.emit('debug', 'Unrecognized symbol '+symbol+', using *');
    }
    var symbol_state = state[symbol];

    if(!!symbol_state){
      // выполняем action
      if(symbol_state.action instanceof Function){
        symbol_state.action.call(this, rawSymbol);
      };

      var prev_state = this.CURRENT_STATE;
      var new_state  = (symbol_state.next === null)
                       ? this.CURRENT_STATE
                       : symbol_state.next;
      // меняем состояние
      if(!!new_state){
        // this.emit('transit-state-from:'+symbol, prev_state, new_state);
        this.CURRENT_STATE = new_state;
        if(prev_state !== new_state){
          this.emit('transit-state-to.'+new_state, prev_state, new_state);
        };
      }else{
        // console.log("Don't know how to handle symbol "+rawSymbol[symbol]);
        throw new FSMTransitionHandleError(this, "Не известно следующее состояние по символу "+rawSymbol.symbol);
      }
    }else{
      throw new FSMUnknownSymbolError(this, symbol, "В таблице переходов состояния "+this.CURRENT_STATE+' не найден переход по символу '+symbol);
    }
  } catch (e) {
    this.emit('error', e);
  }

  return this;
};

function FSMError(fsm, message) {
  this.fsm = fsm;
  this.rawSymbol = rawSymbol;
  this.message = message;
}
util.inherits(FSMError, Error);
FSMError.prototype.name = 'FSMError';

function FSMUnknownSymbolError(fsm, rawSymbol, message) {
  FSMError.call(this, fsm, message);
  this.rawSymbol = rawSymbol;
}
util.inherits(FSMUnknownSymbolError, FSMError);
FSMUnknownSymbolError.prototype.name = 'FSMUnknownSymbolError';

function FSMTransitionHandleError() {
  FSMError.apply(this, arguments);
}
util.inherits(FSMTransitionHandleError, FSMError);
FSMTransitionHandleError.prototype.name = 'FSMTransitionHandleError';
