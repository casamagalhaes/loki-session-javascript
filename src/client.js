/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import io from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import EventEmitter from './event-emitter';

function generateUniqueId() {
  return uuid();
}

class Logger {
  constructor(options) {
    this.debugMode = options.debug || false;
  }

  debug(message, payload) {
    // eslint-disable-next-line no-console
    if (this.debugMode) console.debug(message, payload);
  }

  error(message, payload) {
    // eslint-disable-next-line no-console
    console.error(message, payload);
  }
}

export default class LokiSession extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.logger = new Logger({ debug: options.debug || false });
    this.initialize();
  }

  get appId() {
    return this.options.appId;
  }

  get apiVersion() {
    return this.options.apiVersion || 'v1';
  }

  get apiUrl() {
    const url = this.options.endpoint || 'https://loki.casamagalhaes.services';
    return url;
  }

  get endpoint() {
    return `${this.apiUrl}/${this.appId}`;
  }

  get socketPrefix() {
    return this.options.socketPrefix || '/socket';
  }

  get socketPath() {
    return this.options.socketPath || `${this.socketPrefix}/${this.apiVersion}`;
  }

  get socketSecure() {
    const { secure } = this.options;
    return typeof secure === 'boolean' ? secure : true;
  }

  initialize() {
    this.setupDevice();
    this.setupSocketIO();
  }

  setupDevice() {
    let deviceId = this.storageGet('loki:deviceId');

    if (!deviceId) {
      deviceId = generateUniqueId();
      this.storageSet('loki:deviceId', deviceId);
    }

    this.deviceId = deviceId;
  }

  setupSocketIO() {
    const config = {
      path: this.socketPath,
      secure: this.socketSecure,
      autoConnect: false,
    };

    this.logger.debug('loki socket.io endpoint:', this.endpoint);
    this.logger.debug('loki socket.io config:', config);

    this.socket = io(this.endpoint, config);
  }

  authenticate(session) {
    this.session = session;
    const deviceInfo = this.deviceInfo();

    this.logger.debug('loki register session:', { session, deviceInfo });

    this.socket.on('connected_stabilished', () => {
      this.logger.debug('loki socket connected stabilished');
      this.emit('connected');
      this.socket.emit('authentication', {
        ...session,
        deviceInfo,
      });
    });

    this.socket.on('authenticated', () => {
      this.logger.debug('loki socket authenticated');
      this.emit('authenticated');
    });

    this.socket.on('unauthorized', (reason) => {
      this.logger.debug('loki socket unauthorized', reason);
      this.emit('unauthorized');
      this.socket.disconnect();
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.debug('loki socket disconnect', reason);
      this.emit('disconnect', reason);
    });

    this.socket.on('error', (err) => {
      this.logger.debug('loki socket error', err);
      this.emit('error', err);
    });

    this.logger.debug('loki socket open connection');
    this.socket.open();

    return this;
  }

  destroy() {
    this.logger.debug('loki socket destroy session:');
    this.session = null;

    if (this.socket.connected) {
      this.logger.debug('loki socket disconnect');
      this.socket.disconnect();
    } else {
      this.logger.debug('loki socket already disconnected');
    }

    return this;
  }

  deviceInfo() {
    return {
      deviceId: this.deviceId,
      userAgent: navigator.userAgent || 'Undefined',
    };
  }

  storageGet(key) {
    if (window.localStorage) {
      return window.localStorage.getItem(key);
    }
    this.logger.error('O browser não possui localStorage');
    return null;
  }

  storageSet(key, value) {
    if (window.localStorage) {
      return window.localStorage.setItem(key, value);
    }
    this.logger.error('O browser não possui localStorage');
    return null;
  }
}
