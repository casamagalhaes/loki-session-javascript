import * as io from 'socket.io-client';
import { generateUniqueId, storageGet, storageSet } from './utils'

interface LokiSession {
    sessionToken: string
}

interface LokiSessionClientOptions {
    appId: string;
    apiVersion?: string;
    endpoint?: string;
    debug?: boolean;
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

export default class LokiSessionClient {
    options: LokiSessionClientOptions;
    io: any;
    session: LokiSession;
    logger: Logger;
    deviceId: string;

    constructor(options: LokiSessionClientOptions) {
        this.options = options;
        this.logger = new Logger({ debug: options.debug || false });
        this.io = io(this.endpoint, { autoConnect: false });
        this.initialize();
    }

    initialize() {
        let deviceId = storageGet('loki:deviceId');
        
        if(!deviceId) {
            deviceId = generateUniqueId();
            storageSet('loki:deviceId', deviceId)
        }

        this.deviceId = deviceId;
    }

    get appId() {
        return this.options.appId
    }

    get endpoint() {
        const url = this.options.endpoint || 'https://sessions.casamagalhaes.service';
        return url
    }

    authenticate(session: LokiSession) {
        this.logger.debug(`loki register session:`, session);
        this.session = session;

        this.io.on('connect', () => {
            this.emit('authentication', {
                ...session,
                deviceInfo: this.deviceInfo
            });
        });

        this.io.on('unauthorized', (reason: any) => {
            this.logger.error('Unauthorized', reason)
            this.io.disconnect();
        });

        this.io.open();
        return this;
    }

    destroySession(session: LokiSession) {
        this.logger.debug(`loki register destroy session:`);
        this.emit('logout');
        return this;
    }

    connected(callback: any) {
        this.on('connected_stabilished', callback);
        return this;
    }

    deviceInfo() {
        return {
            deviceId: this.deviceId,
            userAgent: navigator.userAgent || 'Undefined'
        }
    }

    on(event: string, callback: any) {
        this.io.on(event, callback);
    }

    emit(event: string, payload?: any) {
        this.io.emit(event, payload);
    }
}