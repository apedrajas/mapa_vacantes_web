// Configuración de Firebase (solo para autenticación)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
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