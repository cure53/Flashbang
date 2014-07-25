var traceTerminal = new Terminal(document.getElementById("traceTerminal")); traceTerminal.refreshEvery(100);

function appendToTraceTerminal(str, color) {
  var scroll = traceTerminal.isScrolledToBottom();
  traceTerminal.buffer.append(str, color);
  if (scroll) {
    traceTerminal.gotoLine(traceTerminal.buffer.length - 1);
    traceTerminal.scrollIntoView();
  }
}

function stringifyArguments(args) {
  for (var i = 0; i < args.length; i++) {
  	if (!(args[i] instanceof String)) {
  	  args[i] = JSON.stringify(args[i]);
  	}
  }
  return args;
}

var console_log = console.log;
var console_info = console.info;
var console_warn = console.warn;

console.log = function (str) {
  console_log.apply(console, arguments);
  appendToTraceTerminal([].join.call(stringifyArguments(arguments), " "));
};
console.info = function (str) {
  console_info.apply(console, arguments);
  appendToTraceTerminal([].join.call(stringifyArguments(arguments), " "), "#82CAFF");
};
console.warn = function (str) {
  console_warn.apply(console, arguments);
  appendToTraceTerminal([].join.call(stringifyArguments(arguments), " "), "#EA3C53");
};