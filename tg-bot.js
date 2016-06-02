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

  bot_sess.on('game-sess-event', onGameSessEvent.bind(bot, chatId));

  return bot_sess;
};

function onShowHelp(chatId) {
  this.sendMessage(chatId, 'Можно использовать следующие команды:\n stop, help, subscribe, exit');
};

function onStateTransition(chatId, oldState, newState) {
  this.sendMessage(chatId, 'Произошла смена состояния:\n'+oldState+' >> '+newState);
}

function onBotSessionError(chatId, err) {
  this.sendMessage(chatId, 'Произошла ошибка:\n'+err);
}

function onBotShowState(chatId, bot_dialog) {
  this.sendMessage(chatId, bot_dialog.CURRENT_STATE);
}

function onGameSessEvent(chatId) {
  this.sendMessage(chatId, util.inspect(arguments));
}
