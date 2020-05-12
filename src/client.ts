import * as io from 'socket.io-client';
import { generateUniqueId, storageGet, storageSet } from './utils'
import EventEmitter from './event-emitter';

interface Session {
    sessionToken: string
}

interface LokiSessionOptions {
    appId: string;
    apiVersion?: string;
    endpoint?: string;
    debug?: boolean;
    secure?: boolean;
}

interface LoggerOptions {
    debug?: boolean
}

class Logger {
    debugMode: boolean

    constructor(options: LoggerOptions) {
        this.debugMode = options.debug || false
    }

    debug(message: string, payload?: any) {
        if (this.debugMode) console.debug(message, payload);
    }

    error(message: string, payload?: any) {
        console.error(message, payload);
    }
}

export default class LokiSession extends EventEmitter {
    options: LokiSessionOptions;
    io: any;
    session: Session;
    logger: Logger;
    deviceId: string;

    constructor(options: LokiSessionOptions) {
        super();
        this.options = options;
        this.logger = new Logger({ debug: options.debug || false });
        this.initialize();
    }

    get appId() {
        return this.options.appId
    }

    get apiVersion() {
        return this.options.apiVersion || 'v1'
    }

    get apiUrl() {
        const url = this.options.endpoint || 'https://sessions.casamagalhaes.service';
        return url
    }

    get endpoint() {
        return `${this.apiUrl}/${this.appId}`
    }

    get socketPath() {
        return `/${this.apiVersion}/socket`
    }

    get socketSecure() {
        const { secure } = this.options;
        return typeof secure === 'boolean' ? secure : true;
    }

    private initialize() {
        this.setupDevice();
        this.setupSocketIO();
    }

    private setupDevice() {
        let deviceId = storageGet('loki:deviceId');

        if (!deviceId) {
            deviceId = generateUniqueId();
            storageSet('loki:deviceId', deviceId)
        }

        this.deviceId = deviceId;
    }

    private setupSocketIO() {
        this.io = io(this.endpoint, {
            path: this.socketPath,
            secure: this.socketSecure,
            autoConnect: false,
        });
    }

    authenticate(session: Session) {
        this.logger.debug(`loki register session:`, session);
        this.session = session;

        this.io.on('connect', () => {
            this.emit('connected')
            this.io.emit('authentication', {
                ...session,
                deviceInfo: this.deviceInfo
            });
        });

        this.io.on('authenticated', () => {
            this.logger.debug('Authenticated');
            this.emit('authenticated')
        });

        this.io.on('unauthorized', (reason: any) => {
            this.logger.error('Unauthorized', reason)
            this.emit('unauthorized')
            this.io.disconnect();
        });

        this.io.on('disconnect', (reason: any) => {
            this.logger.debug('Disconnected', reason)
            this.emit('disconnect', reason)
        });

        this.io.on('error', (err: any) => {
            this.logger.error('Error', err)
            this.emit('error', err)
        });

        this.io.open();

        return this;
    }

    destroySession(session: LokiSession) {
        this.logger.debug(`loki register destroy session:`);
        this.session = null;
        this.io.disconnect();
        return this;
    }

    connected(callback: any) {
        this.io.on('connected_stabilished', callback);
        return this;
    }

    deviceInfo() {
        return {
            deviceId: this.deviceId,
            userAgent: navigator.userAgent || 'Undefined'
        }
    }
}