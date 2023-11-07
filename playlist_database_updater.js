const { parentPort, workerData } = require("worker_threads");
const db = require("electron-db");
const path = require("path");

writeUpdateToDatabase(workerData.plays);

function writeUpdateToDatabase(plays) {
  console.log("Updating playlist database worker started.");
  const PLAYLIST_TABLE_NAME = "playlist";
  const PLAYLIST_DATABASE_PATH = path.join(__dirname, "");

  if (db.valid(PLAYLIST_TABLE_NAME, PLAYLIST_DATABASE_PATH)) {
    db.clearTable(PLAYLIST_TABLE_NAME, PLAYLIST_DATABASE_PATH, (succ, msg) => {
      if (succ) {
        console.log("Database of playlist cleared.");
      } else {
        setTimeout(() => {
          writeUpdateToDatabase();
        }, 1000 * 60);
      }
    });
    db.insertTableContent(
      PLAYLIST_TABLE_NAME,
      PLAYLIST_DATABASE_PATH,
      plays,
      (succ, msg) => {
        if (succ) {
          console.log("Playlist inserted to database.");
        }
      }
    );
  }
}
