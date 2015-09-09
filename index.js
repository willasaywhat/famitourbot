var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mraa = require('mraa'); //require mraa

// I2C magic
var x = new mraa.I2c(1); // use the i2c bus allocated to the arduino breakout
x.address(0x0F); // i2c address as configured on the board

// helper function to go from hex val to dec  
function char(x) { return parseInt(x, 16); }

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/api/:cmd', function(req, res){
  try{
      controller(req.params.cmd);
      res.send("OK");
  }
  catch(e){
      res.send("BAD");
      console.log(e);
  }
});

io.on('connection', function(socket){
  socket.on('maowbot control', function(msg){
    io.emit('maowbot control', msg);
    console.log(msg);
    controller(msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
  // any startup commands here
  //motor controller config; 10 bytes
  x.writeByte(char('0x01')); // Begin config command; 1
  x.writeByte(char('0x00')); // Enable i2c mode; 0
  x.writeByte(char('0x03')); // Enable individual motor control; 3
  x.writeByte(char('0x3C')); // Low voltage; 60 = 6V
  x.writeByte(char('0xFA')); // M1 max current; 2.5A per R5 = 250
  x.writeByte(char('0xFA')); // M2 max current; 2.5A per R5 = 250
  x.writeByte(char('0xFA')); // M3 max current; 2.5A per R5 = 250
  x.writeByte(char('0xFA')); // M4 max current; 2.5A per R5 = 250
  x.writeByte(char('0x00')); // i2c offset
  x.writeByte(char('0x01')); // i2c master address; 1 = default value
  console.log('motor controller configured');
  x.writeByte(char('0x02')); // Encode config begin command; 2
  x.writeByte(char('0x21')); // Motor max rpm high byte (8500rpm = 0x2134)
  x.writeByte(char('0x34')); // Motor max rpm low byte
  x.writeByte(char('0x00')); // Rover 5 2 state changes per rev x100 = 200 (HB=0)
  x.writeByte(char('0xC8')); // Rover 5 2 state changes per rev x100 = 200 (LB = 0xC8)
  x.writeByte(char('0x32')); // Reserve power 50%
  x.writeByte(char('0x25')); // Max stall time of 37mS (r5 better between 25 and 50)
  console.log('motor encoders configured');
});

// Motor Layout
// M4 - M1
//    |
// M3 - M2
function controller(cmd) {
  console.log(cmd);
  if (cmd.indexOf("stop") > -1) {
    //stop
    x.writeByte(char('0x03')); //Specifies that the data pack is motor control data
    x.writeByte(char('0x00')); //M1 speed high byte
    x.writeByte(char('0x00')); //M1 speed low byte
    x.writeByte(char('0x00')); //M2 speed high byte
    x.writeByte(char('0x00')); //M2 speed low byte
    x.writeByte(char('0x00')); //M3 speed high byte
    x.writeByte(char('0x00')); //M3 speed low byte
    x.writeByte(char('0x00')); //M4 speed high byte
    x.writeByte(char('0x00')); //M4 speed low byte
  }
  if (cmd.indexOf("up") > -1) {
    //forward
    x.writeByte(char('0x03')); //Specifies that the data pack is motor control data
    x.writeByte(char('0x00')); //M1 speed high byte
    x.writeByte(char('0xFF')); //M1 speed low byte
    x.writeByte(char('0x00')); //M2 speed high byte
    x.writeByte(char('0xFF')); //M2 speed low byte
    x.writeByte(char('0x00')); //M3 speed high byte
    x.writeByte(char('0xFF')); //M3 speed low byte
    x.writeByte(char('0x00')); //M4 speed high byte
    x.writeByte(char('0xFF')); //M4 speed low byte
  }
  if (cmd.indexOf("down") > -1) {
    //backward
    x.writeByte(char('0x03')); //Specifies that the data pack is motor control data
    x.writeByte(char('0xFF')); //M1 speed high byte
    x.writeByte(char('0xFF')); //M1 speed low byte
    x.writeByte(char('0xFF')); //M2 speed high byte
    x.writeByte(char('0xFF')); //M2 speed low byte
    x.writeByte(char('0xFF')); //M3 speed high byte
    x.writeByte(char('0xFF')); //M3 speed low byte
    x.writeByte(char('0xFF')); //M4 speed high byte
    x.writeByte(char('0xFF')); //M4 speed low byte
  }
  if (cmd.indexOf("right") == 0) {
    //turn right; right motors fwd, left motors backwards
    x.writeByte(char('0x03')); //Specifies that the data pack is motor control data
    x.writeByte(char('0x00')); //M1 speed high byte
    x.writeByte(char('0xFF')); //M1 speed low byte
    x.writeByte(char('0x00')); //M2 speed high byte
    x.writeByte(char('0xFF')); //M2 speed low byte
    x.writeByte(char('0xFF')); //M3 speed high byte
    x.writeByte(char('0xFF')); //M3 speed low byte
    x.writeByte(char('0xFF')); //M4 speed high byte
    x.writeByte(char('0xFF')); //M4 speed low byte
  }
  if (cmd.indexOf("left") == 0) {
    //turn left; left motors fwd, right motors backwards
    x.writeByte(char('0x03')); //Specifies that the data pack is motor control data
    x.writeByte(char('0xFF')); //M1 speed high byte
    x.writeByte(char('0xFF')); //M1 speed low byte
    x.writeByte(char('0xFF')); //M2 speed high byte
    x.writeByte(char('0xFF')); //M2 speed low byte
    x.writeByte(char('0x00')); //M3 speed high byte
    x.writeByte(char('0xFF')); //M3 speed low byte
    x.writeByte(char('0x00')); //M4 speed high byte
    x.writeByte(char('0xFF')); //M4 speed low byte
  }
}
