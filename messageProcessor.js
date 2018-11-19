/**
 * Message processor reads sensor data and puts it into message format to be sent to the cloud
 */

const TempSensor = require('./mySensor.js');

//sets up message processor using inputs from option
function MessageProcessor(option) {
  option.deviceId = 'Vish-Temp-Sensor';
  this.sensor = new TempSensor(option.i2cOption);
  this.deviceId = option.deviceId;
  this.sensor.init(() => {
    this.inited = true;
  });
}

//uses sensor.read to get data from sensor
//call operates on temperature and other info in a string
MessageProcessor.prototype.getMessage = function (messageId, call) {
  if (!this.inited) { return; }
  this.sensor.read((err, data) => {
    if (err) {
      return;
    }

    call("{ messageId: " + messageId + ", deviceId: " + this.deviceId + ", temperature: " + data.temperature + " }");
  }) 
}

module.exports = MessageProcessor;
