document.addEventListener('DOMContentLoaded', function () {
    const mesaIdElement = document.getElementById('mesa-id');
    const jogadoresCountElement = document.getElementById('jogadores-count');
    const jogadorAtualElement = document.getElementById('jogador-atual');
    const cartasListaElement = document.getElementById('cartas-lista');
    const hitButton = document.getElementById('hit');
    const standButton = document.getElementById('stand');
    const sairMesaButton = document.getElementById('sair-mesa');
    const contadorElement = document.getElementById('contador');
    const vencedorElement = document.getElementById('vencedor');
    const proximaPartidaElement = document.getElementById('proxima-partida');
    const entrarMesaButton = document.getElementById('entrar-mesa');

    const urlParams = new URLSearchParams(window.location.search);
    const mesaId = urlParams.get('mesaId');

    if (!mesaId) {
        alert('Mesa não encontrada.');
        window.location.href = 'http://localhost:5500/index.html';
        return;
    }

    // Define o atributo data-mesa-id do botão "Entrar na Mesa"
    entrarMesaButton.setAttribute('data-mesa-id', mesaId);

    mesaIdElement.textContent = mesaId;

    let contadorIntervalo;
    let atualizacaoIntervalo;
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
                iniciarJogo(); // Inicia o jogo quando o tempo acabar
            } else {
                contadorElement.textContent = formatarContador(tempoRestante);
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    // Função para formatar o contador
    function formatarContador(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segundosRestantes = segundos % 60;
        return `${minutos}:${segundosRestantes < 10 ? '0' + segundosRestantes : segundosRestantes}`;
    }

    // Função para carregar o estado da mesa
    async function carregarMesa() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}`);
            if (!response.ok) throw new Error('Erro ao carregar a mesa');

            const mesa = await response.json();

            // Verifica se o jogador já está na mesa
            const tokenJogador = localStorage.getItem('token');
            if (tokenJogador) {
                const userResponse = await fetch('http://localhost:8080/auth/profile', {
                    headers: { 'Authorization': `Bearer ${tokenJogador}` }
                });

                if (userResponse.ok) {
                    const user = await userResponse.json();
                    const jogadorNaMesa = mesa.jogadores.some(jogador => jogador.id === user.id);
                    if (jogadorNaMesa) {
                        entrarMesaButton.style.display = 'none'; // Oculta o botão
                    }
                }
            }

            if (!mesa.jogoIniciado) {
                if (!contadorIntervalo) {
                    contadorIntervalo = setInterval(atualizarContadorGlobal, 1000);
                }
            } else {
                jogoIniciado = true;
                console.log(mesa.jogadores)
                jogadoresCountElement.textContent = mesa.jogadores.map(jogador => jogador.name).join(', ');

                await atualizarJogadorAtual();
                await atualizarCartasJogador();
                //await atualizarCartas();

                if (mesa.jogoEncerrado) {
                    // Exibir o vencedor
                    const vencedorResponse = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/vencedor`);
                    if (vencedorResponse.ok) {
                        const vencedor = await vencedorResponse.json();
                        vencedorElement.innerHTML = `Vencedor da última partida: <strong>${vencedor.user.name}</strong>`;

                        const tempoRestante = 60; // 5 minutos até a próxima partida
                        proximaPartidaElement.innerHTML = `A próxima partida começa em: <strong>${formatarContador(tempoRestante)}</strong>`;
                    }

                    // Redirecionar após 5 segundos
                    setTimeout(() => {
                        window.location.href = '/index.html';
                    }, 5000);
                }
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    // Função para atualizar o jogador atual
    async function atualizarJogadorAtual() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/jogadoratual`);
            if (response.ok) {
                const jogadorAtual = await response.json();
                jogadorAtualElement.textContent = `Jogador Atual: ${jogadorAtual.name}`;

                const tokenJogador = localStorage.getItem('token');
                if (tokenJogador) {
                    const userResponse = await fetch('http://localhost:8080/auth/profile', {
                        headers: { 'Authorization': `Bearer ${tokenJogador}` }
                    });

                    if (userResponse.ok) {
                        const user = await userResponse.json();
                        const meuTurno = user.id === jogadorAtual.id;
                        hitButton.disabled = !meuTurno;
                        standButton.disabled = !meuTurno;
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar o jogador atual:', error);
        }
    }

    // Função para atualizar as cartas dos jogadores
    async function atualizarCartas() {
        try {
            const tokenJogador = localStorage.getItem('token');
            if (!tokenJogador) {
                console.error('Token não encontrado.');
                return;
            }
    
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/cartas`, {
                headers: { 'Authorization': `Bearer ${tokenJogador}` }
            });
    
            if (response.ok) {
                const cartas = await response.json();
                cartasListaElement.innerHTML = '';
    
                // Exibir apenas as cartas do jogador autenticado
                const li = document.createElement('li');
                li.textContent = `Suas cartas: ${cartas.join(', ')}`;
                cartasListaElement.appendChild(li);
            } else {
                console.error('Erro ao buscar as cartas:', response.statusText);
            }
        } catch (error) {
            console.error('Erro ao atualizar as cartas:', error);
        }
    }

    // Função para iniciar o jogo
    async function iniciarJogo() {
        if (jogoIniciado) {
            alert('O jogo já foi iniciado.');
            window.location.reload();
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/iniciar`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Erro ao iniciar o jogo');

            const result = await response.json();
            alert(result.message);
            jogoIniciado = true; // Marca o jogo como iniciado
            carregarMesa();
            window.location.reload();
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    async function realizarJogada(jogada) {
        const tokenJogador = localStorage.getItem('token');
        if (!tokenJogador) {
            alert('Você precisa estar logado para jogar.');
            window.location.reload();
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

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao realizar a jogada');
            }

            const result = await response.json();
            alert(result.mensagem);
            carregarMesa();
            window.location.reload();
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message);
            window.location.reload();
        }
    }

    // Função para realizar uma jogada (hit ou stand)
    async function atualizarCartasJogador() {
        try {
            const tokenJogador = localStorage.getItem('token');
            if (!tokenJogador) {
                console.error('Token não encontrado.');
                return;
            }
    
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/cartas`, {
                headers: { 'Authorization': `Bearer ${tokenJogador}` }
            });
    
            if (!response.ok) {
                console.error('Erro ao buscar as cartas:', response.statusText);
                return;
            }
    
            const cartas = await response.json();
            if (!Array.isArray(cartas)) {
                console.error('Resposta inválida da API:', cartas);
                return;
            }
    
            cartasListaElement.innerHTML = '';  
            
            cartas.forEach(carta => {
                const li = document.createElement('li');
                li.textContent = `${carta.letra} de ${carta.naipe}`;
                cartasListaElement.appendChild(li);
            });
        } catch (error) {
            console.error('Erro ao atualizar as cartas:', error);
        }
    }
    

    // Função para entrar na mesa
    async function entrarNaMesa(mesaId) {
        const tokenJogador = localStorage.getItem('token'); // Token do usuário
        if (!tokenJogador) {
            alert('Você precisa estar logado para entrar em uma mesa.');
            window.location.href = 'http://localhost:5500/login.html';
            window.location.reload();

            return;
        }

        const entrarButton = document.querySelector(`button[data-mesa-id="${mesaId}"]`);
        if (!entrarButton) {
            console.error('Button not found for mesaId:', mesaId);
            alert('Erro ao encontrar o botão de entrada.');
            window.location.reload();
            return;
        }

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

    // Event listeners para os botões
    hitButton.addEventListener('click', () => realizarJogada('hit'));
    standButton.addEventListener('click', () => realizarJogada('stand'));

    sairMesaButton.addEventListener('click', async () => {
        const tokenJogador = localStorage.getItem('token');
        if (!tokenJogador) {
            alert('Você precisa estar logado para sair da mesa.');
            window.location.reload();
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/sair`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenJogador}`
                }
            });

            if (!response.ok) throw new Error('Erro ao sair da mesa');
            alert('Você saiu da mesa.');
            window.location.href = 'http://localhost:5500/index.html';
        } catch (error) {
            console.error('Erro:', error);
        }
    });

    entrarMesaButton.addEventListener('click', () => {
        const mesaId = new URLSearchParams(window.location.search).get('mesaId');
        if (!mesaId) {
            alert('Mesa não encontrada.');
            window.location.reload();
            return;
        }

        entrarNaMesa(mesaId); // Chama a função para entrar na mesa
    });

    // Iniciar a atualização automática do estado da mesa
    function iniciarAtualizacaoAutomatica() {
        atualizacaoIntervalo = setInterval(carregarMesa, 5000); // Atualiza a cada 5 segundos
    }

    // Iniciar o carregamento da mesa e a atualização automática
    carregarMesa();
    iniciarAtualizacaoAutomatica();
});