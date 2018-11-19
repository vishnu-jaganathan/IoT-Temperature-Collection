
/**
 * Main program that handles the connection to Azure IoT Server
 */

//initial set up of global variables
var messageProcessor;
var flag = true;
var messageId = 1;
var client; 
var config;

//gets message from message processor and sends as an event
function sendMessage() {
  if (!flag) { return; }
  const MyMsg = require('azure-iot-device').Message;
  messageProcessor.getMessage(messageId, (content) => {
    var message = new MyMsg(content);

    console.log(content);
    client.sendEvent(message, (err) => {setTimeout(sendMessage, config.interval);});
    messageId++;
  });
}

//method called to begin data sending
function onStart(request, response) {
	flag = true;
	response.send(200, 'Start sending to cloud.');
}

//method called to end data sending
function onStop(request, response) {
	flag = false;
	response.send(200, 'Stop sending to cloud.');
}

//message callback handler
function receiveMessageCallback(msg) {
  client.complete(msg);
}

//initializes client and configures connection to use x509 authentication if required
function initClient(connectionStringParam, credentialPath) {
 const CS = require('azure-iot-device').ConnectionString;
  var connectionString = CS.parse(connectionStringParam);
  var deviceId = connectionString.DeviceId;
  const mqtt = require('azure-iot-device-mqtt').Mqtt;
  const myClient = require('azure-iot-device').Client;
  client = myClient.fromConnectionString(connectionStringParam, mqtt);
  
  if (connectionString.x509) {
    const f = require('fs');
    const path = require('path');
    var connectionOptions = {
      cert: f.readFileSync(path.join(credentialPath, deviceId + '-cert.pem')).toString(),
      key: f.readFileSync(path.join(credentialPath, deviceId + '-key.pem')).toString()
    };

    client.setOptions(connectionOptions);

  }
  return client;
}


//read configuration and initializes message processor
//also sets up wiring with wpi
(function (connectionString) {

  config = require('./config.json');
  const wiring = require('wiring-pi');
  wiring.setup('wpi');
  const MP = require('./messageProcessor.js');
  messageProcessor = new MP(config);
  const bi = require('az-iot-bi');
  

   bi.start();
   var deviceInfo = { device: "RaspberryPi", language: "NodeJS" };
   if (bi.isBIEnabled()) {
     bi.trackEventWithoutInternalProperties('yes', deviceInfo);
     bi.trackEvent('success', deviceInfo);
   }
   else {
    bi.disableRecordingClientIP();
    bi.trackEventWithoutInternalProperties('no', deviceInfo);
   }
    
   bi.flush();
 

  //creates client and sets up the callback
  connectionString = connectionString || process.env['AzureIoTHubDeviceConnectionString'];
  client = initClient(connectionString, config);

  client.open((err) => {
    if (!err) {
      client.onDeviceMethod('start', onStart);
	  client.onDeviceMethod('stop', onStop);
	  client.on('message', receiveMessageCallback);
      setInterval(() => {config.interval = config.interval;}, config.interval);
      sendMessage();
    }
    else{ return;}
  });
})(process.argv[2]);
