'use strict';

const user = appRequire('plugins/user/index');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;
const emailPlugin = appRequire('plugins/email/index');

exports.getAccount = (req, res) => {
  const userId = req.session.user;
  account.getAccount({
    userId
  }).then(success => {
    success.forEach(f => {
      f.data = JSON.parse(f.data);
      if (f.type >= 2 && f.type <= 5) {
        const time = {
          '2': 7 * 24 * 3600000,
          '3': 30 * 24 * 3600000,
          '4': 24 * 3600000,
          '5': 3600000
        };
        f.data.expire = f.data.create + f.data.limit * time[f.type];
      }
    });
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });;
};

exports.getServers = (req, res) => {
  knex('server').select(['id', 'host', 'name', 'method']).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.getServerPortFlow = (req, res) => {
  const serverId = +req.params.serverId;
  const port = +req.params.port;
  let account = null;
  knex('account_plugin').select().where({
    port
  }).then(success => {
    if (!success.length) {
      return Promise.reject('account not found');
    }
    account = success[0];
    account.data = JSON.parse(account.data);
    const time = {
      '2': 7 * 24 * 3600000,
      '3': 30 * 24 * 3600000,
      '4': 24 * 3600000,
      '5': 3600000
    };
    if (account.type >= 2 && account.type <= 5) {
      const timeArray = [account.data.create, account.data.create + time[account.type]];
      if (account.data.create <= Date.now()) {
        let i = 0;
        while (account.data.create + i * time[account.type] <= Date.now()) {
          timeArray[0] = account.data.create + i * time[account.type];
          timeArray[1] = account.data.create + (i + 1) * time[account.type];
          i++;
        }
      }
      return flow.getServerPortFlow(serverId, port, timeArray);
    } else {
      return [0];
    }
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerPortLastConnect = (req, res) => {
  const serverId = +req.params.serverId;
  const port = +req.params.port;
  flow.getlastConnectTime(serverId, port).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};