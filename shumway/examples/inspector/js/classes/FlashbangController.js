/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var FlashbangController = (function() {

  var STATE_INIT = 0; // Initializing state i.e loading swf etc..
  var STATE_DETECTION = 1; // flashVars detection state
  var STATE_FUZZING = 2; // Payload testing stage, i.e final fuzzing state
  var STATE_DONE = 3; // Finished state

  function simulateEventsOn(item) { // Function responsible for firing events based on the display object
    if (item._buttonMode) {
      var events = ['down', 'over', 'up'];
      for (var i=0; i < events.length; i++){
        item._gotoButtonState(events[i]);
      }
    }
    if (flash.display.InteractiveObject.class.isInstanceOf(item)){
      var events = ['mouseMove', 'mouseOut', 'mouseOver', 'mouseDown', 'mouseUp', 'click', 'doubleClick'];
      for (var i=0; i < events.length; i++){
        item._dispatchEvent(events[i]);
      }
    }
  }

  function traverseChildren(item) { // Traverse the depth of tree starting from stage
    simulateEventsOn(item);

    // If item is container, iterate over its children and recurse
    if ((flash.display.DisplayObjectContainer.class.isInstanceOf(item) ||
         flash.display.SimpleButton.class.isInstanceOf(item)) &&
        item._children &&
        item._children.length > 0)
    {
      var children = item._children;
      for (var i = 0, n = children.length; i < n; i++) {
        if (children[i]) {
          traverseChildren(children[i]);
        }
      }
    }
  }

  var FlashbangController = function(swfController, options) {
    this.swfController = swfController; // This object is key since swf can be paused and played using controller

    // Flashbang options obtained from url
    this.complexDetection = options.complexDetection; // Simple detection as default ;)
    this.timeOut = options.timeOut || 8000; // Default timeOut value is 8000
    this.waitFrames = options.waitFrames || 100; // Default wait frames is 100
    this.uniqueId = options.uniqueId || null;

    // Some defaults, will be obtained later
    this.flashVars = []; // Array consisting of flashVars
    this.sinkCalls = [];
    this.fileName = null; // File name of SWF (required for shumway)
    this.fileBuffer = null; // File Buffer of SWF

    // Initialization parameters
    this.state = STATE_INIT; // State necessary to keep track of things to run

    // Functions for alerting results
    alertResults = null;
  }

  FlashbangController.prototype = {

    _proclaimResults: function _proclaimResults() {
      this.state = STATE_DONE;
      if (alertResults) {
        alertResults(this.flashVars, this.sinkCalls, this.uniqueId);
      } else {
        console.log("Obtained FlashVars :");
        console.log(this.flashVars);
        console.log("Obtained sinkCalls :");
        console.log(this.sinkCalls);
      }
    },

    _checkStatus: function _checkStatus() { // Check if results are ready
      if (this.state == STATE_DETECTION && !this.swfController.isPlaying()) { // Sample case: yt-shim during detection
        this._proclaimResults();
      }
    },

    _executeSWF: function _executeSWF(fileName, fileBuffer, movieParams, callback) {
      this.stageInitializedCallback = function() { this.playIfPaused(callback); }; // Needed since nothing can be done until stage is initialized
      executeFile(fileName, fileBuffer, movieParams); // Function in inspector/js/inspector.js
      setTimeout(this._checkStatus.bind(this), this.timeOut); // Check the status of file ;), initializing implies no need wait anylonger ;)
    },

    playIfPaused: function playIfPaused(callback) { // starts a swf if it is in paused state, callback is fired when resume happens
      if (!this.swfController.isPlaying() && callback) { // If there is a callback, call it and then status check
        var self = this;
        this.swfController.play(this.waitFrames, function() { callback(); self._checkStatus(); }); // TODO: Iterate over multiple frame skips for effective fuzzing
      } else if (!this.swfController.isPlaying()) { // If there is no callback, directly jump to status check
        this.swfController.play(this.waitFrames, this._checkStatus.bind(this));
      } else { // Else case
        callback();
      }
    },

    simulateEvents: function simulateEvents() { // Simulate events on all objects
      traverseChildren(this.swfController.stage);
    },

    addFlashVar: function addFlashVar(variableName) { // Pushes flashVar into array if it doesn't exist already, used during flashVar detection
      if (this.flashVars.indexOf(variableName) == -1) {
        this.flashVars.push(variableName);
      }
    },

    addSinkCall: function addSink(func, data) {
      this.sinkCalls.push([func, data]);
    },

    loadFile: function loadFile(fileName, fileBuffer, movieParams) {  // Just stores file name, buffer and user provided movie params
      this.fileName = fileName;
      this.fileBuffer = fileBuffer;
      this.movieParams = movieParams;

      this.detectVars(); // Default run for now ;)
    },

    detectVars: function detectVars(complexDetection) { // Launches swf and simulates all events on display objects
      complexDetection = complexDetection || this.complexDetection;
      this.state = STATE_DETECTION; // Change state to detection because statusCheck requires it
      if (complexDetection) { // If complex, simulate events as callback after stage is initialized
        this._executeSWF(this.fileName, this.fileBuffer, this.movieParams, this.simulateEvents);
      } else { // If simple, no need do anything. yay!!
        this._executeSWF(this.fileName, this.fileBuffer, this.movieParams);
      }
    }
  }

  return FlashbangController;

}());
