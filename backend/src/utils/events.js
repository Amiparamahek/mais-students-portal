// In-process event bus for live updates. Channels: "u:<userId>" for one person and "admins"
// for every signed-in admin. Events carry no private data, only what changed.
const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(0);

const emitTo = (userIds, payload) => {
  for (const id of [].concat(userIds).filter((x) => x != null)) bus.emit(`u:${id}`, payload);
};
const emitAdmins = (payload) => bus.emit('admins', payload);

module.exports = { bus, emitTo, emitAdmins };
