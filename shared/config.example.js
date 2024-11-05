// Configuración de Firebase (solo para autenticación)
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Inicializar Firebase (solo auth)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Configuración del mapa
const MAP_CONFIG = {
    initialView: [41.648823, -0.889085],
    initialZoom: 13,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19
};

// URL base para datos
const DATA_URL = 'https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/data/vacantes.json'; 

const GITHUB_CONFIG = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO
};