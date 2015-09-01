var RadarClient = require('radar_client').constructor,
    Minilog = require('minilog');

var Client = function(userData) {
  this.logging = new Minilog('client:' + userData.id + ':' + userData.name);

  var rc = this._radarClient = new RadarClient();
  rc.removeAllListeners('authenticateMessage');

  this._radarClient.on('authenticateMessage', function authenticateMessage(message) {
    message.userId = userData.id;
    message.userData = userData;

    rc.emit('messageAuthenticated', message);
  });

  this._configuration = {
    host: 'localhost',
    port: 8000,
    path: '/engine.io-1.4.2', // ZRadar
    secure: false,
    userId: userData.id,
    userType: 2,
    accountName: 'runner'
  };
};

Client.prototype.connect = function(done) {
  this._radarClient.
    configure(this._configuration).
    alloc('runner', done);
};

Client.prototype.presence = function() {
  return this._radarClient.presence.apply(this._radarClient, arguments);
};

module.exports = Client;
