var mqtt    = require('mqtt');
var client  = mqtt.connect('mqtt://121.42.201.80:3001');

client.on('connect', function () {
  client.subscribe('testest_officekit');
  client.publish('testest_officekit', 'Hello mqdddddddtt');
});

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString());
});
