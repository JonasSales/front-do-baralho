document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    // Função para exibir mensagens de erro
    function showError(message) {
        loginMessage.textContent = message;
        loginMessage.style.color = 'red';
    }

    // Função para limpar mensagens de erro
    function clearError() {
        loginMessage.textContent = '';
    }

    // Função para fazer login
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const authRequest = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        };

        // Limpa mensagens de erro anteriores
        clearError();

        fetch('http://localhost:8080/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(authRequest)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Erro ao fazer login');
                });
            }
            return response.text(); // Lê o token como texto
        })
        .then(token => {
            localStorage.setItem('token', token); // Armazena o token no localStorage
            loginMessage.textContent = 'Login realizado com sucesso!';
            loginMessage.style.color = 'green';

            // Redireciona para a página principal após 1 segundo
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        })
        .catch(error => {
            showError(error.message); // Exibe a mensagem de erro
            console.error('Erro:', error);
        });
    });
});