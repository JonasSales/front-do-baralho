document.addEventListener('DOMContentLoaded', function () {
    const mesaIdElement = document.getElementById('mesa-id');
    const jogadoresCountElement = document.getElementById('jogadores-count');
    const jogadorAtualElement = document.getElementById('jogador-atual');
    const cartasListaElement = document.getElementById('cartas-lista');
    const hitButton = document.getElementById('hit');
    const standButton = document.getElementById('stand');
    const sairMesaButton = document.getElementById('sair-mesa');
    const contadorElement = document.getElementById('contador');

    const urlParams = new URLSearchParams(window.location.search);
    const mesaId = urlParams.get('mesaId');

    if (!mesaId) {
        alert('Mesa não encontrada.');
        window.location.href = '/index.html';
        return;
    }

    mesaIdElement.textContent = mesaId;

    let contadorIntervalo;
    let jogoIniciado = false;

    // Função para atualizar o contador global
    async function atualizarContadorGlobal() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/tempo-restante`);
            if (!response.ok) throw new Error('Erro ao obter o tempo restante');

            const { tempoRestante } = await response.json();

            if (tempoRestante <= 0) {
                clearInterval(contadorIntervalo);
                contadorElement.textContent = "0:00";
                iniciarJogo(); // Inicia o jogo automaticamente
            } else {
                contadorElement.textContent = formatarContador(tempoRestante);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao atualizar o contador. Tente novamente.');
        }
    }

    // Função para formatar o contador (minutos:segundos)
    function formatarContador(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segundosRestantes = segundos % 60;
        return `${minutos}:${segundosRestantes < 10 ? '0' + segundosRestantes : segundosRestantes}`;
    }

    // Função para carregar os dados da mesa
    async function carregarMesa() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}`);
            if (!response.ok) throw new Error('Erro ao carregar a mesa');

            const mesa = await response.json();

            if (!mesa.jogoIniciado) {
                // Inicia o contador global se o jogo ainda não começou
                if (!contadorIntervalo) {
                    contadorIntervalo = setInterval(atualizarContadorGlobal, 1000); // Atualiza a cada segundo
                }
            } else {
                jogoIniciado = true;
                jogadoresCountElement.textContent = mesa.quantidadeDeJogadores;

                const jogadorAtualResponse = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/jogadoratual`);
                if (jogadorAtualResponse.ok) {
                    const jogadorAtual = await jogadorAtualResponse.json();
                    jogadorAtualElement.textContent = `Jogador Atual: ${jogadorAtual.user.name}`;

                    // Obtém o jogador autenticado
                    const tokenJogador = localStorage.getItem('token');
                    if (tokenJogador) {
                        const userResponse = await fetch('http://localhost:8080/auth/profile', {
                            headers: { 'Authorization': `Bearer ${tokenJogador}` }
                        });

                        if (userResponse.ok) {
                            const user = await userResponse.json();

                            // Libera os botões apenas se for o turno do jogador autenticado
                            const meuTurno = user.id === jogadorAtual.user.id;
                            hitButton.disabled = !meuTurno;
                            standButton.disabled = !meuTurno;
                        }
                    }
                }

                const cartasResponse = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/cartas`);
                if (cartasResponse.ok) {
                    const cartas = await cartasResponse.json();
                    cartasListaElement.innerHTML = '';
                    for (const [jogador, cartasJogador] of Object.entries(cartas)) {
                        const li = document.createElement('li');
                        li.textContent = `${jogador}: ${cartasJogador.join(', ')}`;
                        cartasListaElement.appendChild(li);
                    }
                }
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar a mesa. Tente novamente.');
        }
    }

    // Função para iniciar o jogo
    async function iniciarJogo() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/iniciar`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Erro ao iniciar o jogo');

            const result = await response.json();
            alert(result.message);
            jogoIniciado = true;
            carregarMesa();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao iniciar o jogo. Tente novamente.');
        }
    }

    // Função para realizar uma jogada (HIT ou STAND)
    async function realizarJogada(jogada) {
        const tokenJogador = localStorage.getItem('token');
        if (!tokenJogador) {
            alert('Você precisa estar logado para jogar.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/jogada`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenJogador}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ jogada: jogada })
            });

            if (!response.ok) throw new Error('Erro ao realizar a jogada');

            const result = await response.json();
            alert(result.mensagem);
            carregarMesa();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao realizar a jogada. Tente novamente.');
        }
    }

    // Event listeners para os botões de jogada
    hitButton.addEventListener('click', () => realizarJogada('hit'));
    standButton.addEventListener('click', () => realizarJogada('stand'));

    // Event listener para o botão de sair da mesa
    sairMesaButton.addEventListener('click', async () => {
        const tokenJogador = localStorage.getItem('token');
        if (!tokenJogador) {
            alert('Você precisa estar logado para sair da mesa.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/sair`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenJogador}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Erro ao sair da mesa');

            const result = await response.json();
            alert(result.message);
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao sair da mesa. Tente novamente.');
        }
    });

    // Inicializa o carregamento da mesa
    carregarMesa();
});