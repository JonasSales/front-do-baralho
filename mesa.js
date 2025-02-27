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

    let contador = 60; 
    let contadorIntervalo;
    let intervalActive = false;  // Controle de intervalo ativo
    let jogoIniciado = false;    // Flag para controlar se o jogo já foi iniciado

    async function carregarMesa() {
        if (intervalActive) return;  // Impede chamadas simultâneas

        intervalActive = true;
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar a mesa');
            }

            const mesa = await response.json();

            if (!mesa.jogoIniciado) {
                if (mesa.quantidadeDeJogadores < 2) {
                    resetarContador();
                } else if (!jogoIniciado) {  // Só decrementa o contador se o jogo não tiver sido iniciado
                    contadorElement.textContent = formatarContador(contador);
                    contador--;
                    if (contador <= 0) {
                        iniciarJogo();
                    }
                }
            } else {
                jogoIniciado = true;  // Marca o jogo como iniciado
                jogadoresCountElement.textContent = mesa.quantidadeDeJogadores;

                // Obter o jogador atual
                const jogadorAtualResponse = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/jogadoratual`);
                if (jogadorAtualResponse.ok) {
                    const jogadorAtual = await jogadorAtualResponse.json();
                    jogadorAtualElement.textContent = jogadorAtual.user.name;

                    // Verificar se o usuário logado é o jogador atual
                    const tokenJogador = localStorage.getItem('token');
                    if (tokenJogador) {
                        const userResponse = await fetch('http://localhost:8080/auth/user', {
                            headers: {
                                'Authorization': `Bearer ${tokenJogador}`
                            }
                        });
                        if (userResponse.ok) {
                            const user = await userResponse.json();
                            if (jogadorAtual.user.name === user.name) {
                                hitButton.disabled = false;
                                standButton.disabled = false;
                            } else {
                                hitButton.disabled = true;
                                standButton.disabled = true;
                            }
                        }
                    }
                }

                // Obter as cartas dos jogadores
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
        } finally {
            intervalActive = false;  // Libera a execução do próximo intervalo
        }
    }

    async function iniciarJogo() {
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/iniciar`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Erro ao iniciar o jogo');
            }

            const result = await response.json();
            alert(result.message);
            jogoIniciado = true;  // Marca o jogo como iniciado
            clearInterval(contadorIntervalo);  // Para o contador
            carregarMesa(); 
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao iniciar o jogo. Tente novamente.');
        }
    }

    function formatarContador(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segundosRestantes = segundos % 60;
        return `${minutos}:${segundosRestantes < 10 ? '0' + segundosRestantes : segundosRestantes}`;
    }

    function resetarContador() {
        if (contadorIntervalo) clearInterval(contadorIntervalo);
        contador = 60;
        contadorElement.textContent = formatarContador(contador);
        contadorIntervalo = setInterval(() => {
            if (!jogoIniciado) {  // Só decrementa o contador se o jogo não tiver sido iniciado
                contador--;
                contadorElement.textContent = formatarContador(contador);
                if (contador <= 0) {
                    iniciarJogo();
                }
            }
        }, 1000);
    }

    async function realizarJogada(jogada) {
        const tokenJogador = localStorage.getItem('token');
        if (!tokenJogador) {
            alert('Você precisa estar logado para realizar uma jogada.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/jogada`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenJogador}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ jogada })
            });

            if (!response.ok) {
                throw new Error('Erro ao realizar a jogada');
            }

            const result = await response.json();
            alert(result);
            carregarMesa();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao realizar a jogada. Tente novamente.');
        }
    }

    hitButton.addEventListener('click', () => realizarJogada('HIT'));
    standButton.addEventListener('click', () => realizarJogada('STAND'));

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

            if (!response.ok) {
                throw new Error('Erro ao sair da mesa');
            }

            const result = await response.json();
            alert(result.message);
            window.location.href = '/index.html'; 
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao sair da mesa. Tente novamente.');
        }
    });

    carregarMesa();
});