/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var controller = new Controller(); // <-- This is the main kid in the block

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

function updateStatus(status) {
  document.getElementById("status").innerHTML = status;
}