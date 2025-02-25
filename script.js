document.addEventListener('DOMContentLoaded', function () {
    const mesasList = document.getElementById('mesas-list');
    const criarMesaButton = document.getElementById('criar-mesa');

    // Função para buscar as mesas da API
    async function fetchMesas() {
        mesasList.innerHTML = '<p>Carregando mesas...</p>';
        try {
            const response = await fetch('http://localhost:8080/blackjack/mesas');
            if (!response.ok) {
                throw new Error('Erro ao buscar mesas');
            }
            const mesas = await response.json();
            displayMesas(mesas);
        } catch (error) {
            console.error('Erro:', error);
            mesasList.innerHTML = '<p>Erro ao carregar as mesas. Tente novamente.</p>';
        }
    }

    // Função para exibir as mesas na página
    function displayMesas(mesas) {
        mesasList.innerHTML = '';
        mesas.forEach(mesa => {
            const mesaCard = document.createElement('div');
            mesaCard.className = 'mesa-card';

            const mesaId = document.createElement('h2');
            mesaId.textContent = `Mesa ${mesa.mesaId}`;

            const mesaInfo = document.createElement('p');
            mesaInfo.textContent = `ID: ${mesa.mesaId}`;

            const jogadoresInfo = document.createElement('p');
            jogadoresInfo.textContent = `Jogadores: ${mesa.quantidadeDeJogadores}`;

            const entrarButton = document.createElement('button');
            entrarButton.textContent = 'Entrar na Mesa';
            entrarButton.setAttribute('data-mesa-id', mesa.mesaId);
            entrarButton.addEventListener('click', () => entrarNaMesa(mesa.mesaId));

            mesaCard.appendChild(mesaId);
            mesaCard.appendChild(mesaInfo);
            mesaCard.appendChild(jogadoresInfo);
            mesaCard.appendChild(entrarButton);

            mesasList.appendChild(mesaCard);
        });
    }

    // Função para criar uma nova mesa
    criarMesaButton.addEventListener('click', async () => {
        const tokenJogador = localStorage.getItem('token'); // Token do usuário
        if (!tokenJogador) {
            alert('Você precisa estar logado para criar uma mesa.');
            window.location.href = '/login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/blackjack/criarMesa', {
                headers: {
                    'Authorization': `Bearer ${tokenJogador}` // Envia o token do usuário
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao criar mesa');
            }

            const data = await response.json();

            // Verifica se o token da mesa foi retornado
            if (!data.token) {
                throw new Error('Token da mesa não foi retornado pelo servidor.');
            }

            // Armazena o token da mesa no localStorage
            localStorage.setItem('tokenMesa', data.token);

            // Redireciona para a página da mesa
            window.location.href = `/mesa.html?mesaId=${data.mesaId}`;
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message || 'Erro ao criar mesa. Tente novamente.');
        }
    });

    // Função para entrar na mesa
    async function entrarNaMesa(mesaId) {
        const tokenJogador = localStorage.getItem('token'); // Token do usuário
        if (!tokenJogador) {
            alert('Você precisa estar logado para entrar em uma mesa.');
            window.location.href = '/login.html';
            return;
        }

        const entrarButton = document.querySelector(`button[data-mesa-id="${mesaId}"]`);
        entrarButton.disabled = true;
        entrarButton.textContent = 'Entrando...';

        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/adicionar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenJogador}`, // Envia o token do usuário
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao entrar na mesa');
            }

            const result = await response.json();
            alert(result.message);

            // Redireciona para a página da mesa após 1 segundo
            setTimeout(() => {
                window.location.href = `/mesa.html?mesaId=${mesaId}`;
            }, 1000);
        } catch (error) {
            console.error('Erro:', error);
            entrarButton.disabled = false;
            entrarButton.textContent = 'Entrar na Mesa';
            alert('Erro ao entrar na mesa. Tente novamente.');
        }
    }

    // Busca as mesas ao carregar a página
    fetchMesas();
});