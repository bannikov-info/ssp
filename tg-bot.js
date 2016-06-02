var TelegramBot = require('node-telegram-bot-api')
    ,request = require('request')
    ,validator = require('validator')
    // ,BotFSM = require('./memory-bot')
    ,FSM = require('./lib/fsm')
    ,BotSession = require('./tg-bot-session')
    ,util = require('util');

var options = {
  polling: true
};

var bot_dialogs = {};

var token = process.env.TELEGRAM_BOT_TOKEN || '239667819:AAF9JkZ-fpA5cPZ9RPYp_bIQJKJzMcdReEg';

var bot = new TelegramBot(token, options);
bot.getMe().then(function (me) {
  console.log('Hi my name is %s!', me.username);
});

// var botFSM = new BotFSM();

bot.onText(/.*/, (msg, match)=>{
  var chatId     = msg.chat.id
      ,userId    = msg.from.id
      ,rawSymbol = match[0];
  console.log('any text: ', rawSymbol);

  var bot_sess = getBotDialog(chatId, userId);

  bot_sess.process(rawSymbol);
});

function getBotDialog(chatId, userId) {
  if(bot_dialogs[chatId] === undefined){
    bot_dialogs[chatId] = {}
  };
  if(bot_dialogs[chatId][userId] === undefined){
    bot_dialogs[chatId][userId] = buildBotDialog(chatId, userId);
  };

  return bot_dialogs[chatId][userId];
}

function buildBotDialog(chatId, userId) {
  var bot_sess = new BotSession();
  bot_sess.on('show-help', onShowHelp.bind(bot, chatId));

  bot_sess.on('transit-state-to.*', onStateTransition.bind(bot, chatId));

  bot_sess.on('error', onBotSessionError.bind(bot, chatId));

  bot_sess.on('show-state', onBotShowState.bind(bot, chatId));

  bot_sess.on('start-tracking.done', onStartTrackingDone.bind(bot, chatId));
  bot_sess.on('start-tracking.fail', onStartTrackingFail.bind(bot, chatId));
  
  bot_sess.on('tracking-params-request', onTrackingParamsRequest.bind(bot, chatId));
  
  bot_sess.on('game-event.data', onGameEventData.bind(bot, chatId));

  return bot_sess;
};

function onShowHelp(chatId) {
  // this.sendMessage(chatId, 'Можно использовать следующие команды:\n stop, help, subscribe, exit');
};

function onStateTransition(chatId, oldState, newState) {
  this.sendMessage(chatId, 'Произошла смена состояния:\n'+oldState+' >> '+newState);
}

function onBotSessionError(chatId, err, bot_sess) {
  this.sendMessage(chatId, err.toString());
}

function onBotShowState(chatId, bot_sess) {
  this.sendMessage(chatId, bot_sess.CURRENT_STATE);
}

function onStartTrackingDone(chatId, evId, bot_sess) {
  // body...
  this.sendMessage(chatId, util.format('Запущено отслеживание хода игры: %s', evId));
}

function onStartTrackingFail(chatId, err, bot_sess) {
  // body...
  this.sendMessage(chatId, "Не удалоь запустить отслеживание игры.");
}

function onTrackingParamsRequest(chatId, bot_sess) {
  // body...
  this.sendMessage(chatId, "Введите URL страницы игры");
};

function onGameEventData(chatId, data, bot_sess) {
  this.sendMessage(chatId, JSON.stringify(data));
}