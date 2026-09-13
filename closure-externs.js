/** @externs */

// Closure's browser externs declare this on Window, but the browser also
// exposes it as a global function and the game calls it without a receiver.
function addEventListener(type, listener, options) {}

// HTML named properties and the Wavedash SDK are supplied by the page/runtime.
var canvas
var deep
var gather
var depth
var highscore
var player2
var restart
var simulationTime
var sound
var innerWidth
var innerHeight
var devicePixelRatio
var localStorage
var setTimeout
