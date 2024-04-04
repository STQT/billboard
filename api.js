const { CONFIG } = require("./settings");
const { Sentry } = require("./main");
const https = require('https');
const fetch = require("node-fetch");
const { app } = require("electron");
const fs = require("fs");
const md5File = require("md5-file");
const db = require("electron-db");
const path = require("path");
const { Worker } = require("worker_threads");
const { Agent } = https;
const moment = require('moment');

const PLAYED_VIDEOS_TABLE_NAME = "playedVideos";
const PLAYLIST_TABLE_NAME = "playlist";
const PLAYED_VIDEOS_DATABASE_PATH = path.join(__dirname, "");
const PLAYLIST_DATABASE_PATH = path.join(__dirname, "");
const DOWNLOAD_FOLDER = app.getPath("downloads") + "\\BillboardClientVideos\\";

const agent = new Agent({
  rejectUnauthorized: false
})

db.createTable(
  PLAYED_VIDEOS_TABLE_NAME,
  PLAYED_VIDEOS_DATABASE_PATH,
  (succ, msg) => {
    console.log("Success: " + succ);
    console.log("Message: " + msg);
  }
);

db.createTable(PLAYLIST_TABLE_NAME, PLAYLIST_DATABASE_PATH, (succ, msg) => {
  console.log("Success: " + succ);
  console.log("Message: " + msg);
});

class APIDriver {
  constructor() {
    this.API_KEY =null;

    // Queue memory
    this.plays = [];

    if (db.valid(PLAYLIST_TABLE_NAME, PLAYLIST_DATABASE_PATH)) {
      db.getAll(PLAYLIST_TABLE_NAME, PLAYLIST_DATABASE_PATH, (succ, data) => {
        if (succ && data.length > 0) {
          this.plays = data[0];
          console.log('Playlist updated from database.')
        } else {
          console.log("Could not read database.");
        }
      });
    }
  }

  async authenticate() {
    if (!this.API_KEY) {
      console.log("Starting authentication");
      try {
        const response = await fetch(CONFIG.BASE_URL + "/users/me/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          agent,
          body: JSON.stringify({
            username: CONFIG.auth.username,
            password: CONFIG.auth.password,
          }),
        });
        const responseJSON = await response.json();
        if (responseJSON["key"]) {
          this.API_KEY = responseJSON["key"];
          console.log("Authentication successful");
        } else {
          console.log(responseJSON);
          Sentry.captureException("Authentication failed");
        }
      } catch (error) {
        console.log("Authentication failed");
        console.log(error);
        Sentry.captureException(error);
      }
    }
  }

  async httpGet(url, default_return_value = null) {
    console.log(`Making an HTTP request to ${url}`);
    return await fetch(CONFIG.BASE_URL + url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.API_KEY}`,
      },
      agent,
    })
      .then((response) => response.json())
      .then((responseJSON) => {
        return responseJSON;
      })
      .catch((error) => {
        console.log(error);
        Sentry.captureException(error);
        return default_return_value;
      });
  }

  async downloadPlayVideoFile(url, dest) {
    console.log('Starting downloader worker process')
    const downloadWorker = new Worker("./downloader.js", {
      workerData: { url: url, dest: dest },
    });
    downloadWorker.on("exit", (exitCode) => {
      console.log("Download finished");
    });
  }

  async getPlays() {
    await this.authenticate();
    let plays = await this.httpGet(`/plays/`, null);
    if (plays) {
      this.plays = plays;
      let playlistWriterWorker = new Worker("./playlist_database_updater.js", {
        workerData: { plays: plays },
      });
      playlistWriterWorker.on("exit", (exitCode) => {
        console.log("Playlist saving worker finished writing.");
      });

    } else {
      if (db.valid(PLAYLIST_TABLE_NAME, PLAYLIST_DATABASE_PATH)) {
        db.getAll(PLAYLIST_TABLE_NAME, PLAYLIST_DATABASE_PATH, (succ, data) => {
          if (succ && data.length > 0) {
            this.plays = data;
          } else {
            console.log("Could not read database.");
          }
        });
      }
    }
  }

  async startDownloadVideos() {
    let playlistUniqueVideoIds = [];
    let playlistUniqueVideos = [];
    

    if (this.plays.length > 0) {
      this.plays.forEach((play) => {
        if (play.type == "MediabazaVideo" || play.type == "ClientVideo") {
          if (!playlistUniqueVideoIds.includes(play.video.id)) {
            playlistUniqueVideos.push(play.video);
            playlistUniqueVideoIds.push(play.video.id);
          }
        }
      });

      console.log(`${playlistUniqueVideoIds.length} videos to be downloaded`)

      playlistUniqueVideos.forEach((video) => {
        if (!this.checkVideoDownload(video)) {
          console.log('Video is not downloaded, pushing to the array of future download video files')
          let url = video.file;
          if (!url.includes("https")) {
            url = url.replace("http", "https");
          }
          this.downloadPlayVideoFile(
            url,
            DOWNLOAD_FOLDER + video.name
          ).catch(console.log);
        }
      })
    }
  }

  checkVideoDownload(video) {
    let dest = DOWNLOAD_FOLDER + video.name;
    if (fs.existsSync(dest)) {
      let calculated_hash = md5File.sync(dest);
      if (calculated_hash == video.hash_sum) {
        return true;
      }
    }
    return false;
  }

  async getNextPlay() {
    console.log("Resolving next pay");
    let fallbackPlay = { type: "Weather" };
    if (this.plays.length > 0) {
      let from_time = new Date(Date.now() - 1000 * 5);
      let to_time = new Date(Date.now() + 1000 * 5);

      let currentPlay;

      currentPlay = this.plays.find((play, index) => {
        let current_date_splitted = moment().format("YYYY-MM-DD");
        let start_time = moment(`${current_date_splitted}T${play.start_time}`, 'YYYY-MM-DDTHH:mm:ss');
        if (from_time < start_time && to_time > start_time) {
          return true;
        }
      });
      console.log(currentPlay);

      if (!currentPlay) {
        console.log(
          "No play found for current time period. Assigning Weather play as fallback."
        );
        currentPlay = { type: "Weather" };
      }

      if (
        currentPlay.type == "ClientVideo" ||
        currentPlay.type == "MediabazaVideo"
      ) {

        
        if (this.checkVideoDownload(currentPlay.video)) {
          console.log(
            "Video is in downloaded videos. Converting to local fs video and playing."
          );

          if (currentPlay.type == "ClientVideo") {
            if (db.valid(PLAYED_VIDEOS_TABLE_NAME, PLAYED_VIDEOS_DATABASE_PATH)) {
              db.insertTableContent(
                PLAYED_VIDEOS_TABLE_NAME,
                PLAYED_VIDEOS_DATABASE_PATH,
                {video: currentPlay.video.id, started_at: new Date().toISOString()},
                (succ, msg) => {
                  if (succ) {
                    console.log("Play recorded to played videos table.");
                  }
                }
              );
            }
          }

          return this.convertPlayToLocal(currentPlay);
        } else {
          console.log(
            "Video is not in downloaded videos. Returning fallback play"
          );
          return fallbackPlay;
        }
      } else {
        return currentPlay;
      }
    }
    console.log("Returning fallback play as no plays in playlist");
    return fallbackPlay;
  }

  convertPlayToLocal(play) {
    if (play.type == "ClientVideo" || play.type == "MediabazaVideo") {
      play.video.file = DOWNLOAD_FOLDER + play.video.name;
    }
    return play;
  }

  async sendReport() {
    console.log("Sending report to server.");
    if (db.valid(PLAYED_VIDEOS_TABLE_NAME, PLAYED_VIDEOS_DATABASE_PATH)) {
      db.getAll(
        PLAYED_VIDEOS_TABLE_NAME,
        PLAYED_VIDEOS_DATABASE_PATH,
        (succ, data) => {
          if (succ && data.length > 0) {
            fetch(CONFIG.BASE_URL + "/reports/", {
              method: "POST",
              headers: {
                "Content-type": "application/json",
                Authorization: `Bearer ${this.API_KEY}`,
              },
              body: JSON.stringify({ plays: data }),
            })
              .then((response) => {
                return response.json();
              })
              .then((responseJSON) => {
                this.clearPlayedVideosTable();
              })
              .catch(console.log);
          } else {
            console.log("Could not read database.");
          }
        }
      );
    }
  }

  clearPlayedVideosTable() {
    db.clearTable(
      PLAYED_VIDEOS_TABLE_NAME,
      PLAYED_VIDEOS_DATABASE_PATH,
      (succ, msg) => {
        if (succ) {
          console.log("Database of played videos cleared.");
        } else {
          setTimeout(() => {
            this.clearPlayedVideosTable();
          }, 1000 * 60);
        }
      }
    );
  }

  async clearFileSystemCache() {
    let downloadedFiles = [];
    fs.readdirSync(DOWNLOAD_FOLDER).forEach(file => {
      downloadedFiles.push(file);
    });

    let playlistUniqueVideos = [];


    if (this.plays.length > 0) {
      this.plays.forEach((play) => {
        if (play.type == "MediabazaVideo" || play.type == "ClientVideo") {
          if (!playlistUniqueVideos.includes(play.video.name)) {
            playlistUniqueVideos.push(play.video.name);
          }
        }
      });
    }

    downloadedFiles.forEach((file) => {
      if (!playlistUniqueVideos.includes(file)) {
        try {
          console.log(`Deleting ${file}`);
          fs.unlinkSync(DOWNLOAD_FOLDER + file);
        } catch(err) {
          console.error(err)
        }
      }
    });

  }

  async preparePlays() {
    console.log("+++++++++++++++ PREPARING PLAYS +++++++++++++++");
    console.log("Awaiting authenticate")
    await this.authenticate();
    console.log("Awaiting getPlays")
    await this.getPlays();
    console.log("Awaiting clearFileSystemCache")
    await this.clearFileSystemCache();
    console.log("Awaiting startDownloadVideos")
    await this.startDownloadVideos().catch((reason) => {
      console.log(reason);
      Sentry.captureException(reason);
  })
  }
}

module.exports.APIDriver = APIDriver;
