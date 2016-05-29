/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)
Updated: Joe Marini (joemarini@google.com)
*/

var chosenEntry = null;
var chooseFileButton = document.querySelector('#choose_file');
var chooseDirButton = document.querySelector('#choose_dir');
var saveFileAsButton = document.querySelector('#save_file_as');
var saveFileButton = document.querySelector('#save_file');
var newFileButton = document.querySelector('#new_file');
// output is commented out - maybe add support for toast notifications later - the value is set in various places in the code below
// for example, on successful save
//var output = document.querySelector('output');
var textarea = document.querySelector('#inputgherkin');

Messenger.options = {
  extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
  theme: 'future',
  maxMessages: 5
}

function errorHandler(e) {
  console.error(e);
}

function displayEntryData(theEntry) {
  if (theEntry.isFile) {
    chrome.fileSystem.getDisplayPath(theEntry, function (path) {
      document.querySelector('#file_path').textContent = path;
    });
    theEntry.getMetadata(function (data) {
      document.querySelector('#file_size').textContent = data.size;
    });
  }
  else {
    document.querySelector('#file_path').textContent = theEntry.fullPath;
    document.querySelector('#file_size').textContent = "N/A";
  }
}

function readAsText(fileEntry, callback) {
  fileEntry.file(function (file) {
    var reader = new FileReader();

    reader.onerror = errorHandler;
    reader.onload = function (e) {
      callback(e.target.result);
    };

    reader.readAsText(file);
  });
}

function writeFileEntry(writableEntry, opt_blob, callback) {
  if (!writableEntry) {
    //output.textContent = 'Nothing selected.';
    return;
  }

  writableEntry.createWriter(function (writer) {

    writer.onerror = errorHandler;
    writer.onwriteend = callback;

    // If we have data, write it to the file. Otherwise, just use the file we
    // loaded.
    if (opt_blob) {
      writer.truncate(opt_blob.size);
      waitForIO(writer, function () {
        writer.seek(0);
        writer.write(opt_blob);
      });
    }
    else {
      chosenEntry.file(function (file) {
        writer.truncate(file.fileSize);
        waitForIO(writer, function () {
          writer.seek(0);
          writer.write(file);
        });
      });
    }
  }, errorHandler);
}

function waitForIO(writer, callback) {
  // set a watchdog to avoid eventual locking:
  var start = Date.now();
  // wait for a few seconds
  var reentrant = function () {
    if (writer.readyState === writer.WRITING && Date.now() - start < 4000) {
      setTimeout(reentrant, 100);
      return;
    }
    if (writer.readyState === writer.WRITING) {
      console.error("Write operation taking too long, aborting!" +
        " (current writer readyState is " + writer.readyState + ")");
      writer.abort();
    }
    else {
      callback();
    }
  };
  setTimeout(reentrant, 100);
}

// for files, read the text content into the textarea
function loadFileEntry(_chosenEntry) {
  chosenEntry = _chosenEntry;
  chosenEntry.file(function (file) {
    readAsText(chosenEntry, function (result) {
      inputCodeMirror.setValue(result);
    });
    // Update display.
    saveFileButton.disabled = false; // allow the user to save the content
    displayEntryData(chosenEntry);
  });
}

// for directories, read the contents of the top-level directory (ignore sub-dirs)
// and put the results into the textarea, then disable the Save As button
function loadDirEntry(_chosenEntry) {
  chosenEntry = _chosenEntry;
  if (chosenEntry.isDirectory) {
    var dirReader = chosenEntry.createReader();
    var entries = [];

    // Call the reader.readEntries() until no more results are returned.
    var readEntries = function () {
      dirReader.readEntries(function (results) {
        if (!results.length) {
          inputCodeMirror.setValue(entries.join("\n"));
          saveFileButton.disabled = true; // don't allow saving of the list
          displayEntryData(chosenEntry);
        }
        else {
          results.forEach(function (item) {
            entries = entries.concat(item.fullPath);
          });
          readEntries();
        }
      }, errorHandler);
    };

    readEntries(); // Start reading dirs.    
  }
}

function loadInitialFile(launchData) {
  if (launchData && launchData.items && launchData.items[0]) {
    loadFileEntry(launchData.items[0].entry);
  }
  else {
    // see if the app retained access to an earlier file or directory
    chrome.storage.local.get('chosenFile', function (items) {
      if (items.chosenFile) {
        // if an entry was retained earlier, see if it can be restored
        chrome.fileSystem.isRestorable(items.chosenFile, function (bIsRestorable) {
          // the entry is still there, load the content
          console.info("Restoring " + items.chosenFile);
          chrome.fileSystem.restoreEntry(items.chosenFile, function (chosenEntry) {
            if (chosenEntry) {
              chosenEntry.isFile ? loadFileEntry(chosenEntry) : loadDirEntry(chosenEntry);
            }
          });
        });
      }
    });
  }
}

chooseFileButton.addEventListener('click', openFile);

function openFile() {
  chrome.storage.sync.get("UnsavedChanges", function (data) {

    if (data.UnsavedChanges == true) {
      vex.dialog.confirm({
        message: '<p>There are unsaved changes. Click Cancel to go back and save, or OK to continue and discard changes.</p>',
        callback: function (value) {
          if (value) {
            openFileSafe();
            return;
          }
          return;
        }
      });

    } else {
      openFileSafe();
    }
  });
}

function openFileSafe() {
  var accepts = [{
    mimeTypes: ['text/feature'],
    extensions: ['feature']
  }];
  chrome.fileSystem.chooseEntry({ type: 'openWritableFile', accepts: accepts }, function (theEntry) {
    if (!theEntry) {
      //output.textContent = 'No file selected.';
      return;
    }
    // use local storage to retain access to this file
    chrome.storage.local.set({ 'chosenFile': chrome.fileSystem.retainEntry(theEntry) });
    loadFileEntry(theEntry);
    var unsavedChanges = { UnsavedChanges: false };

    // Set unsaved changes to false
    chrome.storage.sync.set(unsavedChanges, function () {
      chrome.storage.sync.get("UnsavedChanges", function (data) {
        console.log("UnsavedChanges", data.UnsavedChanges);
      });
    });
  });
}



/* chooseDirButton.addEventListener('click', function(e) {
  chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(theEntry) {
    if (!theEntry) {
      output.textContent = 'No Directory selected.';
      return;
    }
    // use local storage to retain access to this file
    chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
    loadDirEntry(theEntry);
  });
}); */

newFileButton.addEventListener('click', createNewFile);

function createNewFile() {
  chrome.storage.sync.get("UnsavedChanges", function (data) {

    if (data.UnsavedChanges == true) {
      vex.dialog.confirm({
        message: '<p>There are unsaved changes. Click Cancel to go back and save, or OK to continue and discard changes.</p>',
        callback: function (value) {
          if (value) {
            createNewFileSafe();
            return;
          }
          return;
        }
      });
    } else {
      createNewFileSafe();
      chosenEntry = null;
    }
  });
}

function createNewFileSafe() {
  document.querySelector('#file_path').textContent = "";
  document.querySelector('#file_size').textContent = "";
  outputCodeMirror.setValue("");
  inputCodeMirror.setValue("");
  chosenEntry = "";

  var blob = new Blob([outputCodeMirror.getValue()], { type: 'text/plain' });
  writeFileEntry(false, blob, function (e) {
    //do nothing
  });
  var unsavedChanges = { UnsavedChanges: false };

  // Set unsaved changes to false
  chrome.storage.sync.set(unsavedChanges, function () {
    chrome.storage.sync.get("UnsavedChanges", function (data) {
      console.log("UnsavedChanges", data.UnsavedChanges);
    });
  });
}

function saveFileAs() {
  if (chosenEntry == null) {
    chosenEntry = "";
    chosenEntry.name = ".feature";
  }
  if (chosenEntry.name == null) {
    chosenEntry.name = ".feature";
  }
  var accepts = [{
    mimeTypes: ['text/feature'],
    extensions: ['feature']
  }];

  var config = { type: 'saveFile', suggestedName: chosenEntry.name, accepts: accepts };
  chrome.fileSystem.chooseEntry(config, function (writableEntry) {
    var blob = new Blob([inputCodeMirror.getValue()], { type: 'text/feature' });
    writeFileEntry(writableEntry, blob, function () {
      //output.textContent = 'Write complete :)';
      // Try adding next two lines
      chrome.storage.local.set({ 'chosenFile': chrome.fileSystem.retainEntry(writableEntry) });
      loadFileEntry(writableEntry);
      var unsavedChanges = { UnsavedChanges: false };

      // Set unsaved changes to false
      chrome.storage.sync.set(unsavedChanges, function () {
        chrome.storage.sync.get("UnsavedChanges", function (data) {
          console.log("UnsavedChanges", data.UnsavedChanges);
        });
      });
    });
  });
}

function saveFile() {
  if (chosenEntry == null) {
    saveFileAs();
    return;
  }
  if (document.querySelector('#file_path').textContent == "") {
    saveFileAs();
    return;
  }
  var config = { type: 'saveFile', suggestedName: chosenEntry.name };
  var blob = new Blob([inputCodeMirror.getValue()], { type: 'text/feature' });
  chosenEntry.createWriter(function (fileWriter) {

    fileWriter.onwriteend = function () {
      if (fileWriter.length === 0) {
        //fileWriter has been reset, write file
        fileWriter.write(blob);
      } else {
        //file has been overwritten with blob
        //use callback or resolve promise
      }
    };
    fileWriter.truncate(0);

    fileWriter.onerror = function (e) {
      // An error occurred.
    };

    //fileWriter.write(blob);
    Messenger().post("File saved");
    var unsavedChanges = { UnsavedChanges: false };

    // Set unsaved changes to false
    chrome.storage.sync.set(unsavedChanges, function () {
      chrome.storage.sync.get("UnsavedChanges", function (data) {
        console.log("UnsavedChanges", data.UnsavedChanges);
      });
    });

  }, errorHandler);
}

saveFileAsButton.addEventListener('click', saveFileAs);
saveFileButton.addEventListener('click', saveFile);

// Support dropping a single file onto this app.
var dnd = new DnDFileController('body', function (data) {

  chosenEntry = null;
  for (var i = 0; i < data.items.length; i++) {
    var item = data.items[i];
    if (item.kind == 'file' &&
      //item.type.match('text/feature') &&
      item.webkitGetAsEntry()) {
      chosenEntry = item.webkitGetAsEntry();
      break;
    }
  };

  if (!chosenEntry) {
    //output.textContent = "Sorry. That's not a text file.";
    return;
  }
  else {
    //output.textContent = "";
  }

  readAsText(chosenEntry, function (result) {
    inputCodeMirror.setValue(result);
  });
  // Update display.
  saveFileButton.disabled = false;
  displayEntryData(chosenEntry);

});

loadInitialFile(launchData);