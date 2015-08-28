var RadarClient = require('radar_client').constructor,
    Minilog = require('minilog');

var Client = function(options) {
  this.logging = new Minilog('client:' + options.userId);

  this._radarClient = new RadarClient();
  this._configuration = {
    host: 'localhost',
    port: 8000,
    path: '/engine.io-1.4.2', // ZRadar
    secure: false,
    userId: options.userId,
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
