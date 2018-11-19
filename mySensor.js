/**
 * mySensor represents the BMP 280 sensor, which has similar properties to the BME 280 implemented in node_modules
 */


const TempSensor = require('bme280-sensor');

//sets up bmp280 as TempSensor with the options parameter
function Sensor(options) {
  this.bmp280 = new TempSensor(options);
}

//on inits bmp280 then launches callback
Sensor.prototype.init = function (callback) {
  this.bmp280.init().then(callback)
}

//reads data from pins of the bmp280 using the readSensorData function
//and exports tha data through a callback
Sensor.prototype.read = function (callback) {
  this.bmp280.readSensorData().then((data) => {
      data.temperature = data.temperature_C;
      callback(null, data);
    }).catch(callback);
}

module.exports = Sensor;
