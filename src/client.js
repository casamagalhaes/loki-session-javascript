/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import io from 'socket.io-client';
import EventEmitter from './event-emitter';

function trackSmartlook(eventName, properties) {
  try {
    if (smartlook && typeof smartlook === 'function') {
      smartlook('track', eventName, properties);
    }
  } catch (error) {
    // ommit smartlook error
  }
}

class Logger {
  constructor(options) {
    this.debugMode = options.debug || window.LOKI_DEBUG_ENABLED || false;
    this.enableTrack = options.enableTrack || window.LOKI_ENABLE_TRACK || false;
  }

  track(eventName, properties) {
    if (this.enableTrack) {
      trackSmartlook('track', eventName, properties);
    }
  }

  debug(message, payload) {
    if (this.debugMode) {
      if (payload) console.debug(message, payload);
      else console.debug(message);
    }
  }

  error(message, payload) {
    if (payload) console.error(message, payload);
    else console.error(message);
  }
}

export default class LokiSession extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.logger = new Logger({
      debug: options.debug || false,
      enableTrack: options.enableTrack || false,
    });
    this.session = {};
    this.initialize();
  }

  get apiVersion() {
    return this.options.apiVersion || 'v1';
  }

  get endpoint() {
    const url = this.options.endpoint || 'https://loki.casamagalhaes.services';
    return url;
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
    this.logger.debug('[loki] initialize');
    this.setupSocketIO();
  }

  get deviceInfo() {
    return {
      userAgent: navigator.userAgent || 'Undefined',
    };
  }


  getTrackContex(extra = {}) {
    const { sessionToken, deviceInfo } = this;
    const socketId = (this.socket && this.socket.id) || '';

    return {
      socketId,
      sessionToken,
      deviceInfo,
      ...(extra || {}),
    };
  };

  setupSocketIO() {
    this.logger.debug('[loki] setup socket');

    const config = {
      path: this.socketPath,
      secure: this.socketSecure,
      autoConnect: false
    };

    this.socket = io(this.endpoint, config);
    this.socket.on('connection_established', () => {
      this.logger.debug('[loki] socket connection established');
      this.logger.track('LOKI_CONNECTION_ESTABLISHED', this.getTrackContext());

      this.emit('connected');

      const { sessionToken, deviceInfo } = this;
      const payload = { sessionToken, deviceInfo };

      this.logger.debug('[loki] socket trying to authenticate');
      this.socket.emit('authentication', payload);
    });

    this.socket.on('authenticated', () => {
      this.logger.debug('[loki] socket authenticated');
      this.logger.track('LOKI_AUTHENTICATED', this.getTrackContext());
      this.emit('authenticated');
    });

    this.socket.on('unauthorized', (reason) => {
      this.logger.debug('[loki] socket unauthorized', reason);
      this.logger.track('LOKI_UNAUTHORIZED', this.getTrackContext({ reason }));
      this.emit('unauthorized', reason);
      this.socket.disconnect();
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.debug('[loki] socket disconnect', reason);

      if (['io server disconnect', 'ping timeout'].includes(reason)) {
        this.socket.connect();
        return;
      }

      this.logger.debug('[loki] socket disconnect', reason);
      this.logger.track('LOKI_DISCONNECT', this.getTrackContext({ reason }));
      this.emit('disconnect', reason);
    });

    this.socket.on('error', (err) => {
      this.logger.debug('[loki] socket error', err);
      this.logger.track('LOKI_ERROR', this.getTrackContext({ error: err }));
      this.emit('error', err);
    });

    this.socket.on('ping', () => {
      this.logger.debug('[loki] socket ping');
      this.logger.track('LOKI_PING', this.getTrackContext());
    });

    this.socket.on('pong', () => {
      this.logger.debug('[loki] socket pong');
      this.logger.track('LOKI_PONG', this.getTrackContext());
    });

    this.socket.on('reconnect_attempt', () => {
      this.logger.debug('[loki] socket reconnect_attempt');
      this.logger.track('LOKI_RECONNECT_ATTEMPT', this.getTrackContext());
    });
  }

  authenticate(sessionToken) {
    this.sessionToken = sessionToken;
    this.logger.debug('[loki] socket open connection');
    this.logger.track('LOKI_AUTHENTICATE', this.getTrackContext());
    this.socket.open();
    return this;
  }

  destroy() {
    this.sessionToken = null;
    this.logger.debug('[loki] socket destroy session');
    this.logger.track('LOKI_DESTROY', this.getTrackContext());
    this.socket.disconnect();
    return this;
  }
}
