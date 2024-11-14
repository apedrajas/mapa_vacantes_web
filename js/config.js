const CONFIG = {
    map: {
        initialView: [41.648823, -0.889085],
        initialZoom: 13,
        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxZoom: 19
    },
    api: {
        base: '/api',
        auth: '/api/auth.php',
        data: '/api/data.php',
        update: '/api/update.php',
        checkSession: '/api/check-session.php',
        logout: '/api/logout.php',
        upload: '/api/upload.php'
    }
};
