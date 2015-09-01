var kafka = require('kafka-node'),
    nomnom = require('nomnom'),
    pad = require('pad'),
    opts, consumer, client, resource;

opts = nomnom.option('kafkaUrl', { default: 'localhost:2181' })
             .option('ticketId', { required: true })
             .option('account',  { default: 'runner' })
             .parse();

var goOffline = function(clientId) {
  var index = ticketState.indexOf(clientId);
  if (index > -1) { ticketState.splice(index, 1); }
};

var goOnline = function(clientId) {
  ticketState.push(clientId);
};

var isOnline = function(clientId) {
  return ticketState.indexOf(clientId) >= 0;
};

var currentSentry,
    account, 
    ticketId, 
    ticketState = [],
    sessions = {},
    users = {};

account = opts.account;
ticketId = opts.ticketId;
resource = 'presence:/' + account + '/ticket/' + ticketId;

console.log('looking for: ', resource);

client = new kafka.Client(opts.kafkaUrl);
consumer = new kafka.Consumer(client, [ { topic: 'radar.resources', partition: 0 } ], { autoCommit: false });

consumer.on('message', function(message) {
  var value = JSON.parse(message.value),
      data = JSON.parse(value.data),
      userData = data.userData;

  if (!currentSentry) {
    currentSentry = data.stamp.sentryId; 
  }

  if (data.to === resource) {
    switch(data.op) {
      case 'set':
        if (data.value === 'offline') {
          goOffline(data.stamp.clientId);
          console.log(pad(data.stamp.timestamp, 30, ' ') + '->', data.stamp.clientId, ticketState.length);
        } else {
          goOnline(data.stamp.clientId);
          console.log(pad(data.stamp.timestamp, 30, ' ') + '<-', data.stamp.clientId, ticketState.length);
        }
        break;
      case 'client_offline':
        if (currentSentry !== data.stamp.sentryId) { 
          console.log('GOT SOME CLIENT OFFLINE! (Different sentry)', data);
        } else if (isOnline(data.stamp.clientId)) {
          console.log('GOT SOME CLIENT OFFLINE! (WE MANAGED TO SKIP THE SET OFFLINE)', data);
        }
    }
  }
});
