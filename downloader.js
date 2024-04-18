const {parentPort, workerData} = require("worker_threads");

downloadFile(workerData.url, workerData.dest);

function downloadFile(url, dest) {
  const https = require("https");
  const fs = require("fs");
  console.log("Downloading from: " + url);

  var file = fs.createWriteStream(dest);
  var options = {
    rejectUnauthorized: false, // Bypass SSL certificate check
  };

  var request = https
    .get(url, options, function (response) {
      response.pipe(file);
      file.on("finish", function () {
        file.close(); // close() is async, call cb after close completes.
      });
    })
    .on("error", function (err) {
      // Request error
      console.log("Request to server went wrong");
      fs.unlinkSync(dest);
    });
}