import Spawn from 'node-spawn';
import fs from 'fs';
import path from 'path';
import dg from 'debug';
const debug = dg('registrator-cameracoder');

const TEMP_DIR = 'data';

function rmdir (dir, isSecond) {
  try {
    const stat = fs.statSync(dir);
    if (stat) {
      const list = fs.readdirSync(dir);
      for (let i = 0; i < list.length; i++) {
        const filename = path.join(dir, list[i]);
        const stat = fs.statSync(filename);
        if (filename == "." || filename == "..") {
        } else if (stat.isDirectory()) {
          this.rmdir(filename, true);
        } else {
          fs.unlinkSync(filename);
        }
      }
      if (isSecond) {
        debug('rmdir path:', dir);
        fs.rmdirSync(dir);
      } else {
        debug('rmdir path:', dir);
      }
    }
  }
  catch (e) {
    switch (e.code) {
      case 'ENOENT':
        fs.mkdirSync(dir);
        debug('Folder created:', dir);
        break;
      default:
        debug('err: ', e.message);
        break;
    }
  }
}

export function start (sessionId, callback) {
  const folder = path.resolve(TEMP_DIR, sessionId.toString());
  rmdir(folder);
  const spawn = Spawn({
    cmd: 'ffmpeg',
    args: ['-i', 'rtsp://user:user21@10.157.197.33/axis-media/media.amp', '-f', 'segment', '-map', '0:0', '-vcodec', 'copy',
      '-reset_timestamps', '1', '-f', 'dash', 'manifest.mpd'],
    cwd: folder,
    restarts: 0,
    onStdout: (data) => {
      // debug('stdout on data', data);
    },
    onStderr: (data) => {
      // debug('stderr on data', data);
    }
  });
  spawn.start();
  debug('Child process started.');
  return callback();
}
