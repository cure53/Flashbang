/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

function readFile(file) {
  var reader = new FileReader();
  if (file.name.endsWith(".abc") || file.name.endsWith(".swf")) {
    reader.onload = function() {
      controller.loadFile(file.name, this.result);
    }
  } else {
    throw new TypeError("unsupported format");
  }
  reader.readAsArrayBuffer(file);
}

document.body.addEventListener("dragenter", function(event) {
  event.stopPropagation();
  event.preventDefault();
});

document.body.addEventListener("dragover", function(event) {
  event.stopPropagation();
  event.preventDefault();
});

document.body.addEventListener("drop", function(event) {
  event.stopPropagation();
  event.preventDefault();
  var file = event.dataTransfer.files[0];
  readFile(file);
});

document.getElementById("files").addEventListener("change", function(event) {
  var file = event.target.files[0];
  readFile(file);
  document.getElementById('openFile').style.display = 'none';
  document.getElementById('fileBtnRow').style.display = 'none';
  document.getElementById('flashbangDataRow').style.display = 'block';
});

document.getElementById("openFile").addEventListener("click", function () {
  document.getElementById("files").click();
});