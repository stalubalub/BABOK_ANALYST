import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { getProjectDir } from '../project.js';

function busPath(projectId) {
  return path.join(getProjectDir(projectId), 'agent_messages.jsonl');
}

export function createMessageBus(projectId) {
  const emitter = new EventEmitter();
  const filePath = busPath(projectId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const append = (event) => {
    fs.appendFileSync(filePath, JSON.stringify(event) + '\n', 'utf-8');
  };

  const publish = (type, payload = {}) => {
    const event = {
      type,
      projectId,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    append(event);
    emitter.emit(type, event);
    emitter.emit('*', event);
    return event;
  };

  const subscribe = (type, handler) => {
    emitter.on(type, handler);
    return () => emitter.off(type, handler);
  };

  return {
    filePath,
    publish,
    subscribe,
  };
}
