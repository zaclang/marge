// Description:
//   Loads ES6 into Hubbot!

require('babel-register');

// shut up Hubbot about expecting a function but receiving an object when checking module.exports
module.exports = function es6(robot) {};

