import Sequelize from 'sequelize';
import store from './store';
import async from 'async';

const sequelize = new Sequelize('cameraserver', 'user', 'user21', {
  dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
  port: 5432,
  logging: false,
});

const Session = sequelize.define('session', {
  startedAt: {
    type: Sequelize.DATE
  },
  stoppedAt: {
    type: Sequelize.DATE
  },
  mpdHeader: {
    type: Sequelize.JSON
  },
  isWorking: {
    type: Sequelize.BOOLEAN
  },
});

const Segment = sequelize.define('segment', {
  duration: {
    type: Sequelize.INTEGER
  },
  chunkNumber: {
    type: Sequelize.STRING
  }
});
sequelize.Session = Session;
sequelize.Segment = Segment;
Session.hasMany(Segment, { as: 'Segments' });

function syncForce (force, callback) {
  // перезапись таблиц + 1 сессия для теста
  Session.sync({ force })
    .then(() => {
      Segment.sync({ force })
        .then(() => {
          Session.create({
            isWorking: false
          }).then(() => {
            return callback();
          });
        });
    });
}

function clearStore (callback) {
  Session.findAll()
    .then(sessions => {
      async.eachLimit(sessions, 1, (session, sessionDone) => {
        const sessionId = session.get('id');
        Segment.findAll({ where: { sessionId } })
          .then((segments) => {
            console.log('запущена очистка файлов сессии в сторе. sessionId', sessionId);
            async.eachLimit(segments, 1, (segment, segmentDone) => {
              let tail = 'init-stream0.m4s';
              if (segment.chunkNumber > 0) {
                tail = segment.chunkNumber + '.m4s';
              }
              const key = sessionId + '_' + tail;
              store.exists({ key }, (err, isExists) => {
                if (isExists) {
                  store.remove({ key }, (err) => {
                    if (err) {
                      console.log(key, ' err removed.', err.message);
                      return segmentDone(err);
                    } else {
                      segment.destroy().then(() => {
                        console.log(key, ' file removed.');
                        return segmentDone(err);
                      });
                    }
                  });
                } else {
                  console.log('clearStore store.exists file:', key, ' not found.');
                  return segmentDone();
                }
              });
            }, (err) => {
              if (err) {
                return sessionDone(err);
              }
              session.destroy().then(() => {
                return sessionDone();
              });
            });
          });
      }, (err) => {
        return callback(err);
      });
    })
}

sequelize.seed = (callback) => {
  clearStore((err) => {
    if (err) {
      return callback(err);
    }
    syncForce(true, callback);
  });
};

export default sequelize;
