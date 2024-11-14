document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(CONFIG.api.auth, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            window.location.href = 'index.php';
        } else {
            alert('Error de autenticación');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de autenticación');
    }
}); 