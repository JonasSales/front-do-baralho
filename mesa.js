document.addEventListener('DOMContentLoaded', function () {
    const mesaIdElement = document.getElementById('mesa-id');
    const jogadoresCountElement = document.getElementById('jogadores-count');
    const jogadorAtualElement = document.getElementById('jogador-atual');
    const cartasListaElement = document.getElementById('cartas-lista');
    const hitButton = document.getElementById('hit');
    const standButton = document.getElementById('stand');
    const sairMesaButton = document.getElementById('sair-mesa');
    const contadorElement = document.getElementById('contador');
    const vencedorInfoElement = document.getElementById('vencedor-info');
    const vencedorElement = document.getElementById('vencedor');
    const proximaPartidaElement = document.getElementById('proxima-partida');
    const urlParams = new URLSearchParams(window.location.search);
    const mesaId = urlParams.get('mesaId');

    if (!mesaId) {
        alert('Mesa não encontrada.');
        window.location.href = '/index.html';
        return;
    }

    mesaIdElement.textContent = mesaId;

    let contadorIntervalo;
    let atualizacaoIntervalo;
    let jogoIniciado = false;

    async function atualizarContadorGlobal() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/tempo-restante`);
            if (!response.ok) throw new Error('Erro ao obter o tempo restante');

            const { tempoRestante } = await response.json();

            if (tempoRestante <= 0) {
                clearInterval(contadorIntervalo);
                contadorElement.textContent = "0:00";
                iniciarJogo(); 
            } else {
                contadorElement.textContent = formatarContador(tempoRestante);
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    function formatarContador(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segundosRestantes = segundos % 60;
        return `${minutos}:${segundosRestantes < 10 ? '0' + segundosRestantes : segundosRestantes}`;
    }

    async function carregarMesa() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}`);
            if (!response.ok) throw new Error('Erro ao carregar a mesa');
    
            const mesa = await response.json();
    
            if (!mesa.jogoIniciado) {
                if (!contadorIntervalo) {
                    contadorIntervalo = setInterval(atualizarContadorGlobal, 1000);
                }
            } else {
                jogoIniciado = true;
                jogadoresCountElement.textContent = mesa.quantidadeDeJogadores;
    
                await atualizarJogadorAtual();
                await atualizarCartas();
    
                if (mesa.jogoEncerrado) {
                    // Exibir o vencedor
                    const vencedorResponse = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/vencedor`);
                    if (vencedorResponse.ok) {
                        const vencedor = await vencedorResponse.json();
                        vencedorElement.innerHTML = `Vencedor da última partida: <strong>${vencedor.user.name}</strong>`;
    
                        const tempoRestante = 5 * 60; // 5 minutos até a próxima partida
                        proximaPartidaElement.innerHTML = `A próxima partida começa em: <strong>${formatarContador(tempoRestante)}</strong>`;
                    }
    
                    // Cooldown de 5 segundos antes de redirecionar
                    await new Promise(resolve => setTimeout(resolve, 5000));
    
                    // Redirecionar para a página inicial
                    clearInterval(atualizacaoIntervalo);
                    window.location.href = '/mesa.html';
    
                    // Realizar o reload da página após o redirecionamento
                    window.location.reload();  // Isso vai recarregar a página geral
                }
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    async function atualizarJogadorAtual() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/jogadoratual`);
            if (response.ok) {
                const jogadorAtual = await response.json();
                jogadorAtualElement.textContent = `Jogador Atual: ${jogadorAtual.user.name}`;

                const tokenJogador = localStorage.getItem('token');
                if (tokenJogador) {
                    const userResponse = await fetch('http://localhost:8080/auth/profile', {
                        headers: { 'Authorization': `Bearer ${tokenJogador}` }
                    });

                    if (userResponse.ok) {
                        const user = await userResponse.json();
                        const meuTurno = user.id === jogadorAtual.user.id;
                        hitButton.disabled = !meuTurno;
                        standButton.disabled = !meuTurno;
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar o jogador atual:', error);
        }
    }

    async function atualizarCartas() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/cartas`);
            if (response.ok) {
                const cartas = await response.json();
                cartasListaElement.innerHTML = '';
                for (const [jogador, cartasJogador] of Object.entries(cartas)) {
                    const li = document.createElement('li');
                    li.textContent = `${jogador}: ${cartasJogador.join(', ')}`;
                    cartasListaElement.appendChild(li);
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar as cartas:', error);
        }
    }

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
        }
    }

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
        }
    }

    hitButton.addEventListener('click', () => realizarJogada('hit'));
    standButton.addEventListener('click', () => realizarJogada('stand'));

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
                    'Authorization': `Bearer ${tokenJogador}`
                }
            });

            if (!response.ok) throw new Error('Erro ao sair da mesa');
            alert('Você saiu da mesa.');
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Erro:', error);
        }
    });

    carregarMesa();
});
