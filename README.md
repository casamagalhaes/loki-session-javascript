#loki-session-javascript

<script src="/loki-session-client.js"></script>

```js
const client = new LokiSessionClient({appId: 'varejofacil'});

async function login(email, senha) {
    // Realiza o login com o backend e retorna os tokens, inclusive o sessionToken
    const { sessionToken } = await fazLoginComApi(email, senha);

    if(sessionToken) {
        await client.authenticate({sessionToken});
    }
};

async function logout(email, senha) {
    // Seu app faz algo aqui e então destroy a sessão do loki
    await client.destroy();
};

async function onInit() {
    // no bootstrap do seu app, tentar recuperar a sessão armazenda e inicializar o loki
    const { sessionToken } = await buscarDadosGravados();
    await client.authenticate({ sessionToken });
};
```

```js
// O loki não conseguiu autorizar o token enviado
client.on('unauthorized', function(reason) => {
    console.err(reason);
    // Realizar o logout 
});

// após o loki confirmar a sessão
client.on('authenticated', function(err) => {
    console.err(err);
});

//
client.on('error', function(err) => {
    console.err(err);
});
```