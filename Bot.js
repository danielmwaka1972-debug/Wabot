const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "120.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            console.log('✅ Connecté !');
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log('Déconnecté, code:', code);
            if (code !== DisconnectReason.loggedOut) startBot();
        }
        if (connection === 'connecting') {
            if (!sock.authState.creds.registered) {
                setTimeout(async () => {
                    try {
                        const code = await sock.requestPairingCode("243984739613");
                        console.log('CODE DE JUMELAGE:', code);
                    } catch (e) {
                        console.log('Erreur pairing:', e.message);
                    }
                }, 3000);
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const from = m.key.remoteJid;
        if (text.toLowerCase() === 'menu') {
            await sock.sendMessage(from, { text: '*Menu*\n1 - Prix\n2 - Horaires\n3 - Contact' });
        }
    });
}

startBot();
