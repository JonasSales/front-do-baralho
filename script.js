document.addEventListener('DOMContentLoaded', function () {
    const mesasList = document.getElementById('mesas-list');

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
        if (mesas.length === 0) {
            mesasList.innerHTML = '<p>Nenhuma mesa disponível no momento.</p>';
            return;
        }

        mesas.forEach(mesa => {
            const mesaCard = document.createElement('div');
            mesaCard.className = 'mesa-card';

            const mesaId = document.createElement('h2');
            mesaId.textContent = `Mesa ${mesa.mesaId}`;

            const mesaInfo = document.createElement('p');
            mesaInfo.textContent = `ID: ${mesa.mesaId}`;

            const jogadoresInfo = document.createElement('p');
            jogadoresInfo.textContent = `Jogadores: ${mesa.quantidadeDeJogadores}`;

            const statusInfo = document.createElement('p');
            statusInfo.textContent = `Status: ${mesa.jogoIniciado ? 'Jogo Iniciado' : 'Aguardando Jogadores'}`;

            const encerradaInfo = document.createElement('p');
            encerradaInfo.textContent = `Encerrada: ${mesa.todosJogadoresEncerraramMao ? 'Sim' : 'Não'}`;

            const entrarButton = document.createElement('button');
            entrarButton.textContent = 'Entrar na Mesa';
            entrarButton.setAttribute('data-mesa-id', mesa.mesaId);
            entrarButton.addEventListener('click', () => entrarNaMesaComoObservador(mesa.mesaId));

            // Desabilita o botão se o jogo já começou ou a mesa está encerrada
            if (mesa.jogoIniciado || mesa.todosJogadoresEncerraramMao) {
                entrarButton.disabled = true;
                entrarButton.textContent = 'Mesa Indisponível';
            }

            mesaCard.appendChild(mesaId);
            mesaCard.appendChild(mesaInfo);
            mesaCard.appendChild(jogadoresInfo);
            mesaCard.appendChild(statusInfo);
            mesaCard.appendChild(encerradaInfo);
            mesaCard.appendChild(entrarButton);

            mesasList.appendChild(mesaCard);
        });
    }


    // Função para entrar na mesa
    function entrarNaMesaComoObservador(mesaId) {
        const tokenJogador = localStorage.getItem('token'); // Token do usuário
        if (!tokenJogador) {
            alert('Você precisa estar logado para visualizar uma mesa.');
            window.location.href = '/login.html';
            return;
        }
    
        const entrarButton = document.querySelector(`button[data-mesa-id="${mesaId}"]`);
        if (entrarButton) {
            entrarButton.disabled = true;
            entrarButton.textContent = 'Redirecionando...';
        }
    
        // Redireciona para a página da mesa após 1 segundo
        setTimeout(() => {
            window.location.href = `/mesa.html?mesaId=${mesaId}`;
        }, 1000);
    }

    // Busca as mesas ao carregar a página
    fetchMesas();
});