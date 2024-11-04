// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBC1kPdX1P7GC1S7MZi_DAokUJ3apeiAzk",
    authDomain: "mapa-vacantes-web.firebaseapp.com",
    projectId: "mapa-vacantes-web",
    storageBucket: "mapa-vacantes-web.firebasestorage.app",
    messagingSenderId: "614745270053",
    appId: "1:614745270053:web:01cd62617e8ff16ee75ccc"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Configuración del mapa
const MAP_CONFIG = {
    initialView: [41.648823, -0.889085],
    initialZoom: 13,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19
};
