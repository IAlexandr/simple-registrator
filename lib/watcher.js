import store from './store';
import fs from 'fs';
import path from 'path';
const TEMP_DIR = 'data';
import db from './db';
import manifestParser from './manifest-parser';
import dg from 'debug';
const debug = dg('registrator-watcher');


function getChunkNumber (filename) {
  const numbers = filename.match(/\d*\./g);
  return numbers ? numbers[0].replace('.', '') : 0;
}

function move({ filename, folder, sessionId}, callback) {
  db.Segment.create().then((segment) => {
    let tail = '';
    if (filename.match(/chunk/g)) {
      segment.chunkNumber = getChunkNumber(filename);
      tail = segment.chunkNumber + '.m4s';
    } else {
      segment.chunkNumber = 0;
      tail = 'init-stream0.m4s';// filename;
    }
    const fileStoreKey = sessionId + '_' + tail;

    const ws = store.createWriteStream({
      key: fileStoreKey
    });
    const readFilePath = path.resolve(folder, filename);
    debug(readFilePath, ' writing to ', fileStoreKey);
    const rs = fs.createReadStream(readFilePath);
    rs.on('data', (data) => {
      if (segment.chunkNumber > 0 && !segment.duration) {
        segment.duration = data.readUInt32BE(68);
      }
      ws.write(data);
    });

    rs.on('end', () => {
      ws.end();
      fs.unlink(readFilePath);
      setTimeout(() => {
        store.exists({key: fileStoreKey}, (err, isExists) => {
          debug(fileStoreKey, isExists);
        });
      }, 500);

      return callback(null, segment);
    });
    rs.on('error', (err) => {
      debug('ERROR: ', filename, err.message);
      ws.close();
      return callback(err);
    });
  });
}

export function watch (session) {
  const sessionId = session.get('id');
  const folder = path.resolve(TEMP_DIR, sessionId.toString());
  fs.watch(folder, (eventType, filename) => {
    switch (eventType) {
      case 'rename':
        if (!filename.match(/.tmp/g) && filename !== 'manifest.mpd' && filename !== 'init-stream0.m4s') {
          const filePath = path.resolve(folder, filename);
          fs.stat(filePath, (err, stats) => {
            if (stats) {
              move({ filename, folder, sessionId }, (err, segment) => {
                if (err) {
                  debug('err', err.message);
                } else {
                  segment.save().then(() => {
                    session.save();
                    session.addSegment(segment);
                    debug('segment number', segment.chunkNumber, 'saved and file moved.');
                  });
                }
              });
            }
          });
        }
        break;
      case 'change':
        if (filename === 'manifest.mpd' && !session.mpdProps) {
          const filePath = path.resolve(folder, filename);
          manifestParser(filePath, (err, mpdJSON) => {
            if (err) {
              debug('err:', err.message);
            } else {
              session.mpdProps = mpdJSON;
              session.save();
            }
          });
        } else if (filename === 'init-stream0.m4s') {
          const filePath = path.resolve(folder, filename);
          fs.stat(filePath, (err, stats) => {
            if (stats) {
              move({ filename, folder, sessionId }, (err, segment) => {
                if (err) {
                  debug('err', err.message);
                } else {
                  segment.save().then(() => {
                    session.save();
                    session.addSegment(segment);
                    debug('segment number', segment.chunkNumber, 'saved and file moved.');
                  });
                }
              });
            }
          });
        }
        break;
    }
  });
}
