/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var controller = new Controller(); // <-- This is the main kid in the block

function showElements(className) {
  var validClasses = ["preload", "beforeFuzz", "duringFuzz", "afterFuzz"];
  for (var i = 0; i < validClasses.length; i++) {
    if (className == validClasses[i]) {
      $("." + validClasses[i]).show();
    } else {
      $("." + validClasses[i]).not($("." + className)).hide();
    }
  }
}

function displayFileName(name) {
  $("#fileName").text(name);
}

function toggleComplexDetection(boolValue) {
  controller.complexDetection = boolValue;
}

function updateTimeOut(value) {
  if (value === parseInt(value)) {
    controller.timeOut = value;
  }
}

function updateWaitFrames(value) {
  if (value === parseInt(value)) {
    controller.waitFrames = value;
  }
}

function updateFlashVarTable() {
  var flashVarsDict = {};
  $("#flashVarTable tbody tr").remove();
  $.each(controller.vars, function(flashVar, props) {
    flashVarsDict[flashVar] = Math.random().toString(36).substr(2, 5);;
    var rowClass = props["type"] ? "active" : ""
    $("#flashVarTable tbody").append("<tr class=\""+rowClass+"\"><td>"+flashVar+"</td><td>"+props["type"]+"</td></tr>");
  });
  $("#flashVarsUrl").text($.param(flashVarsDict));
}

function updateSinkCallTable() {
  $("#sinkCallTable tbody tr").remove();
  $.each(controller.vulns, function(index, vuln) {
    $("#sinkCallTable tbody").append("<tr><td>"+
                                            vuln['sink']+
                                        "</td>"+
                                        "<td><pre>"+
                                            js_beautify(vuln['sinkData'], {"indent_size":2})+
                                        "</pre></td>"+
                                        "<td><pre>"+
                                            js_beautify(JSON.stringify(vuln['flashVars']), {"indent_size":2})+
                                        "</pre></td></tr>");
  });
}

function rerunAnalysis() {
  controller.rerun();
}

function promptBugReport() {
  $("#bugReport").show();
}

// Spinner code

var opts = {
  lines: 8, // The number of lines to draw
  length: 4, // The length of each line
  width: 4, // The line thickness
  radius: 6, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#ffffff', // #rgb or #rrggbb or array of colors
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: true, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '50%' // Left position relative to parent
};

var spinner;

function updateStatus(state) {
  switch (state) {
    case 1: // Fuzzing started or going on
      spinner = new Spinner(opts).spin(document.getElementById("status"));
      showElements("duringFuzz");
      break;
    case 2: // Fuzzing finished
      spinner.stop();
      showElements("afterFuzz");
      // Bug Test - If 0 flashVars prompt user for a bug report
      if (Object.keys(controller.vars).length == 0) promptBugReport();
      break;
  }
}

// Relatively big files which on preloading will give better user exp. on slow internet connection
function cacheLargeFiles() {
  // Start spinner to show loading in progress
  spinner = new Spinner(opts).spin(document.getElementById("status"));
  showElements("preload");
  $.when(
    $.get("../shumway/build/playerglobal/playerglobal.abcs"),
    $.get("../shumway/build/playerglobal/playerglobal.json"),
    $.get("../shumway/src/avm2/generated/builtin/builtin.abc")).done(function() {
      spinner.stop();
      // Also hide everything non relavent
      showElements("beforeFuzz");
    });
}

$(document).ready(cacheLargeFiles);

