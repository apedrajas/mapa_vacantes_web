// Configuración de Firebase (solo para autenticación)
const firebaseConfig = {
    apiKey: "AIzaSyBC1kPdX1P7GC1S7MZi_DAokUJ3apeiAzk",
    authDomain: "mapa-vacantes-web.firebaseapp.com",
    projectId: "mapa-vacantes-web",
    messagingSenderId: "614745270053",
    appId: "1:614745270053:web:01cd62617e8ff16ee75ccc"
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
