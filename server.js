import {start} from './lib/cameracoder';
import {watch} from './lib/watcher';
import dg from 'debug';
const debug = dg('registrator');
import db from './lib/db';

db.seed(() => {
  db.Session.findOne()
    .then((session) => {
      start(session.get('id'), (err) => {
        if (err) {
          debug(err.message);
        } else {

          session.createdAt = new Date();
          session.isWorking = true;
          session.save().then(() => {
            debug('Test session created.');
          });
          watch(session);
        }
      });
    });
});

// TODO express