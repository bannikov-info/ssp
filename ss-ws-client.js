var WebSocketClient = require('websocket').client
    ,argv = require('optimist').argv
    ,events = require('events');

module.exports.GameEventsSubscription = GameEventsSubscription;

module.exports.subscribe = function (evId) {
  return new GameEventsSubscription(evId);
}

function GameEventsSubscription(evId){
  if (!evId) { throw new Error('evId is required'); };

  var headers = {
        "Host":"socket.sofascore.com:10010",
        "Origin":"http://www.sofascore.com",
        "Sec-WebSocket-Extensions":"permessage-deflate; client_max_window_bits",
        "Sec-WebSocket-Key":"LhzQo2b9ev9do4lZKKDtrQ=="
      },
      wsUrl = "ws://socket.sofascore.com:10010/ServicePush/"
      ,me = this
      ,client = new WebSocketClient();



  client.on('connectFailed', function(error) {
      me.emit('error', error);
  });

  client.on('connect', function(connection) {
      connection.on('error', function(error) {
          me.emit('error', error);
      });
      connection.on('close', function() {
          me.emit('close');
      });
      connection.on('message', function(message) {
          if (message.type === 'utf8') {
              try {
                var data = JSON.parse(message.utf8Data).data[1].data;
              } catch (e) {
                return me.emit(new Error('не удалось получить объект данных', e))
              }
              me.emit('data', data)
          }
      });

      connection.on('pong', function(frame) {
          // if (message.type === 'utf8') {
              console.log("pong: '" + frame + "'");
              setTimeout(()=>{
                var ts = Date.now().toString();
                console.log("ping: '"+ts+"'");
                connection.ping(ts)
              }, 25000);
          // }
      });

      var describe_request = {
          type: 0,
          data: ["subscribe", {id: "event", events: ["event_"+evId]}]
        }
      connection.send(JSON.stringify(describe_request))
  });


  this.start = function () {
    client.connect(wsUrl, null, "http://www.sofascore.com", headers, null);
  }

  this.stop = function () {
    client.abort();
  }

}

GameEventsSubscription.prototype = new events();
