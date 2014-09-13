/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var Controller = (function() {

  // States will be useful when lauching multiple instances once, HAIL MARY!!!
  var STATE_INIT = 0; // Initializing state i.e loading swf etc..
  var STATE_FUZZING = 1; // Payload testing stage, i.e final fuzzing state
  var STATE_DONE = 2; // Finished state

  // Prepare an iframe will respective callbacks
  function prepareIframe(url, uniqueId, onLoadCallback, resultsCallback) {
    var iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden'; // Keep it hidden
    iframe.src = url;
    iframe.sandbox = "allow-scripts allow-same-origin";
    // Override alert with callback, since alert is used to proclaim results
    iframe.onload = function() {
      iframe.contentWindow.console.log = console.log;
      iframe.contentWindow.console.warn = console.warn;
      iframe.contentWindow.console.info = console.info
      iframe.contentWindow.alertResults = resultsCallback;
      onLoadCallback(iframe, uniqueId);
    };
    document.body.appendChild(iframe);
    return iframe;
  }

  // Remove an iframe
  function removeIframe(iframe) {
    document.body.removeChild(iframe);
  }

  // Get random strings of length n, used for uniqueId and initial sink detection calls
  function getRandomString(n) {
    return Math.random().toString(36).substr(2, n);
  }

  // Returns a random number between 1 & 10000
  function getRandomNumber() {
    return Math.floor((Math.random() * 10000) + 1);
  }

  var Controller = function() {
  // Naming this Controller to avoid confusion with FlashbangController which is a part of shumway
    this.fileName = null; // File name of SWF (required for shumway)
    this.fileBuffer = null; // File Buffer of SWF

    // The following dicts have to be cleaned on killing of corresponding shumway instance
    this.movieParams = {}; // Dict of parameter objects indexed by uniqueId
    this.testRegex = {}; // Dict of expected sink data indexed by uniqueId
    this.iframes = {}; // Dictionary using uniqueId

    // The main crisp of everything
    this.vars = {}; // Key: flashVar , value: {type:null, payloadId:null }
    this.vulns = []; // All vuln flashVar combinations are stored here

    // Some parameters for running shumway, which are editable from the interface;
    this.complexDetection = false;
    this.waitFrames = null;
    this.timeOut = null;

    // Initialization parameters
    this.state = STATE_INIT; // State necessary to keep track of things to run
  }

  Controller.prototype = {

    _resetData: function _resetData() {
      this.vars = {};
      this.vulns = [];
    },

    _addVuln: function _addVuln(flashVars, sink, sinkData, vulnVar) { // Add vulnerable set of flashVars
      // We might get duplicates here, so filtering should be done here itself
      var replacedSinkData = sinkData;
      var duplicate = false; // Variable which holds the boolean

      for (var flashVar in flashVars) { // Replace all the flashVar values with flashVars in sinkData
        replacedSinkData = replacedSinkData.replace(flashVars[flashVar], "@@@"+flashVar+"@@@");
      }

      for (var i=0; i<this.vulns.length; i++) { // Use the replaced replacedSinkData to check for duplicates
        if ((sink == this.vulns[i]["sink"]) && // If sink func is same and
            (vulnVar == this.vulns[i]["vulnVar"]) && // if vulnerable var is same and
            (replacedSinkData == this.vulns[i]["replacedSinkData"])) { // if replacedSinkData is same
          duplicate = true; // Definitely a duplicate
        }
      }

      if (!duplicate) { // Add only if not duplicate
        this.vulns.push({
          "flashVars":flashVars, // All the flashVars and their values which are passed
          "sink":sink, // The sink which caused this vuln
          "sinkData":sinkData, // The data which ended up in the sink
          "replacedSinkData":replacedSinkData, // FlashVar values are replaced by the flashvars enclosed by "@@@"
          "vulnVar":vulnVar // The possible flashVar which might have caused this
          // TODO: Assert with assurance for the bad flashVar
        });
      }
      return(!duplicate); // Return the boolean
    },

    _updateState: function _updateState(state) {
      this.state = state;
      if (updateStatus) { // Might go headless sometimes
        updateStatus(state);
      }
    },

    _buildURL: function _buildURL(uniqueId) { // INSPECTOR is a global, remember all caps means global
      var url = INSPECTOR + "?uniqueId=" + uniqueId; // Present in flashbang.html
      if (this.complexDetection) url = url + "&complexDetection=true";
      if (this.waitFrames) url = url + "&waitFrames=" + this.waitFrames.toString();
      if (this.timeOut) url = url + "&timeOut=" + this.timeOut.toString();
      return url;
    },

    _launchShumwayInstance: function _launchShumwayInstance(uniqueId) { // Just launches the shumway inspector page with proper parameters
      var url = this._buildURL(uniqueId);
      console.log("------------ Launching new instance ------------");
      // Need to bind everything since all callbacks will be in the context of the iframe but we need our dear controller
      this.iframes[uniqueId] = prepareIframe(url, uniqueId, this._loadSWF.bind(this), this._collectResults.bind(this));
    },

    _killShumwayInstance: function _killShumwayInstance(uniqueId) {
      // Kill iframe and clean dictionaries, we donot want to end up in memory pressure (pwn2own):P
      console.log("------------ Killing used instance ------------");
      removeIframe(this.iframes[uniqueId]);
      delete this.movieParams[uniqueId];
      delete this.iframes[uniqueId];
      delete this.testRegex[uniqueId];
    },

    _loadSWF: function _loadSWF(iframe, uniqueId) { // A callback used to loadSWF in a shumway instance
      console.log("Loading movie parameters");
      console.log(this.movieParams[uniqueId]);
      iframe.contentWindow.flashbangController.loadFile(this.fileName, this.fileBuffer, this.movieParams[uniqueId]);
    },

    _addFlashVar: function _addFlashVar(flashVar) { // Add flashVar to the set of known flashVars
      this.vars[flashVar] = {
        "type" : null, // Needed to remember sink this flashVar data ends up
        "lastPayloadIndex" : -1 // Needed while trying payloads :P
      }
    },

    _collectResults: function _collectResults(varsArray, sinkCalls, uniqueId) {
      var varsUpdated = false;
      var vulnsUpdated = false;

      // Iterate over all flashVars detected and add any new ones if present
      for (var i = 0; i < varsArray.length; i++) { // Iterate over obtained vars and add any new ones to our "vars"
        if (!(varsArray[i] in this.vars)) {
          this._addFlashVar(varsArray[i])
          varsUpdated = true;
        }
      }

      // SinkCall extraction, sinkCalls is an array of array [[sinkFunc, dataThatEndedUpThere]]
      // So, we check the data against our provided flashVar values for a match
      for (var i = 0; i < sinkCalls.length; i++) {
        var func = sinkCalls[i][0];
        var data = sinkCalls[i][1];
        if (data) { // If the data is undefined there is no point proceeding, because we cannot check with undefined
          for (var flashVar in this.movieParams[uniqueId]) {
            // If our flashVar data is just present in the sink data, we call it a match and remember the sink
            if (!(this.vars[flashVar]["type"]) && data.indexOf(this.movieParams[uniqueId][flashVar]) > -1) {
              this.vars[flashVar]["type"] = func;
              varsUpdated = true;
            // We check with the test regex if we are able to get what we wanted
            } else if (this.testRegex[uniqueId][flashVar] && this.testRegex[uniqueId][flashVar].test(data)) {
              // Deduplication is done inside the method
              // Why use vulnAdded instead of using vulnsUpdated ??
              // Think??
              // Think??
              // If same vuln appears twice in a run, this logic will only work
              var vulnAdded = this._addVuln(this.movieParams[uniqueId], func, data, flashVar);
              if (vulnAdded) vulnsUpdated = true;
            }
          }
        }
      }

      // After the all the checking, just kill the instance and erase all data related to it
      this._killShumwayInstance(uniqueId);

      // Update the UI after killing off the instance, check if UI part exists because we can become headless o.O
      if (varsUpdated && updateFlashVarTable)
        updateFlashVarTable();
      if (vulnsUpdated && updateSinkCallTable)
        updateSinkCallTable();

      if (varsUpdated || vulnsUpdated) {// If we nothing in the last round, bail out
        this.fuzzSWF(); // <-- Next iteration
      } else {
        this._updateState(STATE_DONE);
      }
    },

    loadFile: function loadFile(fileName, fileBuffer) {  // Just stores file name, buffer and user provided movie params
      this.fileName = fileName;
      this.fileBuffer = fileBuffer;

      this.run(); // Start flashbang ;)
    },

    run: function run() {
      this._updateState(STATE_FUZZING); // Change state to fuzzing
      this.fuzzSWF();
    },

    rerun: function rerun() { // Reset the data and run again
      this._resetData();
      this._updateState(STATE_INIT);
      this.run();
    },

    fuzzSWF: function fuzzSWF() {
      // Go through the steps carefully :P

      // First check if there are any flashVars and try to populate them according to their sink types
      // this.movieParams[uniqueId] <-- is the attribute to use for flashVars to run the SWF
      uniqueId = getRandomString(5);

      // An array used to store present flashVars, so that duplicate values are avoided
      var flashVarValues = new Array();

      // Will be created here and cleaned up after result collection
      this.movieParams[uniqueId] = {};
      this.testRegex[uniqueId] = {};

      // Iterate over know vars and populate them with payloads or random data as per our knowledge of the sink
      for (var flashVar in this.vars) {
        var sinkType = this.vars[flashVar]["type"];
        var lastPayloadIndex = this.vars[flashVar]["lastPayloadIndex"]; // A temporary variable to play with
        var currentPayloadIndex = null;

        // Check if there is a sinkType &
        // if there are untested payloads &
        // same payload is not already being used in this run
        if (sinkType &&
            lastPayloadIndex < (PAYLOADS[sinkType].length - 1) &&
            flashVarValues.indexOf(PAYLOADS[sinkType][++lastPayloadIndex]["payload"]) == -1) {
          currentPayloadIndex = ++this.vars[flashVar]["lastPayloadIndex"]; // Increment the index for testing next payload
          flashVarValues.push(PAYLOADS[sinkType][currentPayloadIndex]["payload"]); // Pushed to check value duplication
          this.movieParams[uniqueId][flashVar] = PAYLOADS[sinkType][currentPayloadIndex]["payload"];
          this.testRegex[uniqueId][flashVar] = PAYLOADS[sinkType][currentPayloadIndex]["regex"];
        } else {
          this.movieParams[uniqueId][flashVar] = getRandomNumber().toString(); // getRandomString(10);
        }
      }

      this._launchShumwayInstance(uniqueId); // <-- Everything from here is managed automagically
    }
  }

  return Controller;

}());
