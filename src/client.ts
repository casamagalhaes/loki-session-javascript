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
}

export default class LokiSessionClient {
    options: LokiSessionClientOptions;
    websocket: any;
    session: LokiSession;

    constructor(options: LokiSessionClientOptions) {
        this.options = options;
        this.websocket = io(this.endpoint);
    }

    get appId() {
        return this.options.appId
    }

    get endpoint() {
        const url = this.options.endpoint || 'https://ws-sessions.casamagalhaes.service';
        return `${url}/${this.appId}`
    }

    async registerSession(session: LokiSession) {
        this.session = session;
        this.emit('set_session', session);
    }

    on(event: string, callback: any) {
        this.websocket.on(event, callback);
    }

    emit(event: string, payload: any) {
        this.websocket.emit(event, payload);
    }
}