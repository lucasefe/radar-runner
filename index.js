var Minilog = require('minilog'),
    Client = require('./client.js'),
    logging = new Minilog('main'),
    clients = [], 
    resources = [],
    NAMES = [
      [ 'Julia', 1],
      [ 'Robert', 2],
      [ 'Luke', 3],
      [ 'Anakin', 4], 
      [ 'Leia', 5],
      [ 'Silvia', 6] ,
      [ 'Tam', 7]
    ],
    SIZE = NAMES.length;

Minilog.suggest.defaultResult = false;
Minilog
  .suggest
  .clear()
  .allow('main', 'debug')
  .allow(new RegExp('client:.*'), 'debug');

Minilog.enable();

var randomUser = function() {
  var index = Math.floor(Math.random() * SIZE),
      user = NAMES[index],
      userData = { id: user[1], name: user[0] };

  return userData;
};

var nextTime = function() {
  return Math.floor(Math.random() * 1000);
};

var clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

var runClient = function(client) {
  var states = {};

  var togglePresence = function() {
    var index = Math.floor(Math.random() * SIZE),
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

var createClient = function(res) {
  var userData = randomUser(),
      client = new Client({ 
        id: userData.id, name: userData.name
      }),
      resources = clone(res);

  console.log(userData);
  
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

for(var j = 1; j <= SIZE; j++) {
  resources.push('ticket/' + j);
}

for(var j = 1; j <= SIZE; j++) {
  logging.info('Creating client ' + j);
  createClient(resources);
}
