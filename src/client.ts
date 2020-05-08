import * as io from 'socket.io-client';

interface LokiTenant {
    id: string;
}

interface LokiIdentity {
    principalId: string;
}

interface LokiSession {
    tenant: LokiTenant,
    identity: LokiIdentity;
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
    websocket: any;
    session: LokiSession;
    logger: Logger;

    constructor(options: LokiSessionClientOptions) {
        this.options = options;
        this.logger = new Logger({ debug: options.debug || false });
        this.websocket = io(this.endpoint);
        this.logger.debug(`loki session endpoint: ${this.endpoint}`);
        this.registeListeners();
    }

    get appId() {
        return this.options.appId
    }

    get endpoint() {
        const url = this.options.endpoint || 'https://ws-sessions.casamagalhaes.service';
        return `${url}/${this.appId}`
    }

    async registerSession(session: LokiSession) {
        this.logger.debug(`loki register session:`, session);
        this.session = session;
        this.emit('set_session', session);
        return this;
    }

    connected(callback: any) {
        this.on('connected_stabilished', callback);
        return this;
    }

    onSessionInfo(callback: any) {
        this.on('session_info', callback);
        return this;
    }

    onSessionCount(callback: any) {
        this.on('session_count', callback);
        return this;
    }

    on(event: string, callback: any) {
        this.websocket.on(event, callback);
    }

    emit(event: string, payload: any) {
        this.websocket.emit(event, payload);
    }

    private registeListeners() {
        this.websocket.on('connected_stabilished', () => {
            this.logger.debug(`loki connected_stabilished:`);
        });

        this.websocket.on('session_info', (payload: any) => {
            this.logger.debug(`loki session_info:`, payload);
        });
    }
}