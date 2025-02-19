document.addEventListener("DOMContentLoaded", function() {
    const jogadoresList = document.getElementById('lista-jogadores');
    const jogadorAtualInfo = document.getElementById('jogador-atual-info');
    const cartasInfo = document.getElementById('cartas-info');
    const mensagemDiv = document.getElementById('mensagem');
    const hitButton = document.getElementById('hit');
    const standButton = document.getElementById('stand');
    const btnFinalizar = document.getElementById('btnFinalizar');
    const contadorDisplay = document.getElementById('contador-display');

    const apiUrl = "http://localhost:8080/blackjack";  // Substitua pela URL da sua API
    let partidaIniciada = false;
    let contador = 10;
    let intervaloContador;

    function exibirMensagem(mensagem) {
        mensagemDiv.textContent = mensagem;
    }

    async function verificarPartidaIniciada() {
        try {
            const response = await fetch(`${apiUrl}/partidaIniciada`);
            const data = await response.json();
            partidaIniciada = data.jogoIniciado === 'true'; // Ajuste conforme a resposta da API

            if (partidaIniciada) {
                btnFinalizar.disabled = false;
                pararContagem();
            } else {
                btnFinalizar.disabled = true;
                iniciarContagem();
            }
        } catch (error) {
            exibirMensagem("Erro ao verificar o estado da partida.");
        }
    }

    async function listarJogadores() {
        try {
            const response = await fetch(`${apiUrl}/jogadores`);
            const jogadores = await response.json();
            jogadoresList.innerHTML = jogadores.map(player => `<li>${player.nome}</li>`).join('');
        } catch (error) {
            exibirMensagem("Erro ao carregar jogadores.");
        }
    }

    async function exibirJogadorAtual() {
        try {
            const response = await fetch(`${apiUrl}/jogadoratual`);
            const jogadoresAtuais = await response.json();
            if (jogadoresAtuais != null) {
                jogadorAtualInfo.textContent = jogadoresAtuais[0].nome;
            } else {
                finalizarJogo();
            }
        } catch (error) {
            finalizarJogo();
        }
    }

    async function exibirCartas() {
        try {
            const response = await fetch(`${apiUrl}/cartas`);
            const cartasPorJogador = await response.json();
            cartasInfo.innerHTML = Object.entries(cartasPorJogador).map(([jogador, cartas]) => {
                return `<strong>${jogador}</strong>: ${cartas.join(', ')}`;
            }).join('<br>');
        } catch (error) {
            exibirMensagem("Erro ao carregar as cartas.");
        }
    }

    function finalizarJogo() {
        if (partidaIniciada) {
            partidaIniciada = false;
            btnFinalizar.disabled = true;
            hitButton.disabled = true;
            standButton.disabled = true;
    
            fetch(`${apiUrl}/finalizar`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
            })
            .catch(error => console.error("Erro ao finalizar jogo:", error))
            .finally(() => {
                setTimeout(() => {
                    btnFinalizar.disabled = false;
                }, 5000);
            });

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    async function fazerJogada(jogada) {
        const jogadorAtual = jogadorAtualInfo.textContent;
    
        if (!jogadorAtual || !jogada) {
            exibirMensagem("Jogador atual ou jogada inválida.");
            return;
        }
    
        try {
            const response = await fetch(`${apiUrl}/jogada`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player: { nome: jogadorAtual },
                    jogada: jogada
                })
            });
    
            const data = await response.json();
            exibirMensagem(data.mensagem);
            exibirJogadorAtual();
            exibirCartas();
    
            if (data.pontuacao > 21 || jogada === 'stand') {
                proximoJogador();
            }
        } catch (error) {
            exibirMensagem("Erro ao realizar jogada.");
        }
    }

    hitButton.addEventListener('click', function() {
        fazerJogada('hit');
    });

    standButton.addEventListener('click', function() {
        fazerJogada('stand');
    });

    function atualizarInformacoes() {
        listarJogadores();
        exibirJogadorAtual();
        exibirCartas();
        verificarPartidaIniciada();
    }

    function iniciarContagem() {
        if (!intervaloContador) {
            intervaloContador = setInterval(async () => {
                contador--;
                contadorDisplay.textContent = `Tempo: ${contador} segundos para a próxima rodada`;

                if (contador === 0) {
                    try {
                        const response = await fetch(`${apiUrl}/jogadores`);
                        const jogadores = await response.json();
            
                        if (jogadores.length >= 2) {
                            const iniciarResponse = await fetch(`${apiUrl}/iniciar`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
            
                            const data = await iniciarResponse.json();
                            exibirMensagem(data.mensagem || 'Partida iniciada com sucesso!');
                            verificarPartidaIniciada();
                        } else {
                            exibirMensagem('Aguardando mais jogadores para iniciar a partida...');
                        }
                    } catch (error) {
                        exibirMensagem('Erro ao verificar jogadores ou iniciar a partida.');
                    }

                    contador = 10;
                }
            }, 1000);
        }
    }

    function pararContagem() {
        clearInterval(intervaloContador);
        intervaloContador = null;
    }

    verificarPartidaIniciada();
    setInterval(atualizarInformacoes, 1000);
    atualizarInformacoes();
});
