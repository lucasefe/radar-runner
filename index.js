var Minilog = require('minilog'),
    Client = require('./client.js'),
    logging = new Minilog('main'),
    clients = [], 
    resources = [];

Minilog.suggest.defaultResult = false;
Minilog
  .suggest
  .clear()
  .allow('main', 'debug')
  .allow(new RegExp('client:.*'), 'debug');

Minilog.enable();

var nextTime = function() {
  return Math.floor(Math.random() * 1000);
};

var clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

var runClient = function(client) {
  var states = {};

  var togglePresence = function() {
    var index = Math.floor(Math.random() * 10),
        resource = resources[index];

    if (resource) {
      if (states[resource]) {
        client.presence(resource).set('offline', function(){
          client.logging.info('Going OFFLINE on', resource);
          states[resource] = false;
          setTimeout(togglePresence, nextTime()); 
        });
      } else {
        client.presence(resource).set('online', function(){
          client.logging.info('Going ONLINE on', resource);
          states[resource] = true;
          setTimeout(togglePresence, nextTime()); 
        });
      }
    } else {
      client.logging.debug('Could not find resource wit index', index);
      togglePresence();
    }
  };

  setTimeout(togglePresence, nextTime());
};

var createClient = function(res, userId) {
  var client = new Client({ userId: userId}),
      resources = clone(res);
  
  var subscribeClient = function() {
    var resource = resources.shift(); 

    if (!resource) { 
      client.logging.info('Done subscribing to resources');
      client.logging.info('Let\'s interact!');
      setTimeout(function(){ 
        runClient(client);
      }, nextTime());
      return;
    }

    client.logging.info('Subscribing to resource: ', resource);
    client.presence(resource).subscribe(function() {
      setTimeout(subscribeClient, nextTime());
    });
  };

  clients.push(client);
  client.connect(subscribeClient);
};

for(var j = 1; j <= 10; j++) {
  resources.push('ticket/' + j);
}

for(var j = 1; j <= 10; j++) {
  logging.info('Creating client ' + j);
  createClient(resources, j);
}
