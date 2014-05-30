/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * TODO: Have to add LICENSE
 */

var FlashbangController = (function() {

  var STATE_INIT = 0;  // Initializing state i.e loading swf etc..
  var STATE_DETECTION = 1;  // flashVars detection state
  var STATE_FUZZING = 2;  // Payload testing stage, i.e final fuzzing state

  var state = STATE_INIT;

  function simulateEventsOn(item) {  // Function responsible for firing events based on the display object
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

  function traverseChildren(item) {  // Traverse the depth of tree starting from stage
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

  var FlashbangController = function(swfController) {
    this.swfController = swfController;  // This object is key since swf can be paused and played using controller
    this.flashVars = [];  // Array consisting of flashVars
    this.fileName = null;  // File name of SWF (required for shumway)
    this.fileBuffer = null;  // File Buffer of SWF
  }

  FlashbangController.prototype = {

    _executeSWF: function _executeSWF(fileName, fileBuffer, movieParams, callback) {
      this.stageInitializedCallback = function() { this.playIfPaused(callback); };  // Needed since nothing can be done until stage is initialized
      executeFile(fileName, fileBuffer, movieParams);  // Function in inspector/js/inspector.js
    },

    playIfPaused: function playIfPaused(callback) {  // starts a swf if it is in paused state, callback is fired when resume happens
      if (!this.swfController.isPlaying()) {
        this.swfController.play(100, callback);  // TODO: Iterate over multiple frame skips for effective fuzzing
      } else {
        callback();
      }
    },

    simulateEvents: function simulateEvents() {  // Simulate events on all objects
      traverseChildren(this.swfController.stage);
    },

    addFlashVar: function addFlashVar(variableName) { // Pushes flashVar into array if it doesn't exist already, used during flashVar detection
      if (this.flashVars.indexOf(variableName) == -1) {
        this.flashVars.push(variableName);
      }
    },

    loadFile: function loadFile(fileName, fileBuffer, movieParams) {  // Just stores file name, buffer and user provided movie params
      this.fileName = fileName;
      this.fileBuffer = fileBuffer;
      this.movieParams = movieParams || {}; // Built using flashVars

      // this.fuzzForVars();  // A temporary call which will be later replaced by intelligent fuzzing
      this._executeSWF(this.fileName, this.fileBuffer, this.movieParams, this.simulateEvents);
    },

    fuzzForVars: function fuzzForVars() {  // Launches swf and simulates all events on display objects
      state = STATE_DETECTION;
      this._executeSWF(this.fileName, this.fileBuffer, this.movieParams, this.simulateEvents);
    }
  }

  return FlashbangController;

}());
