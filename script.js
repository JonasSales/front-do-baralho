document.addEventListener("DOMContentLoaded", function() {
    const jogadoresList = document.getElementById('lista-jogadores');
    const jogadorAtualInfo = document.getElementById('jogador-atual-info');
    const cartasInfo = document.getElementById('cartas-info');
    const mensagemDiv = document.getElementById('mensagem');
    const hitButton = document.getElementById('hit');
    const standButton = document.getElementById('stand');
    const btnFinalizar = document.getElementById('btnFinalizar');

    const apiUrl = "http://localhost:8080/blackjack";  // Substitua pela URL da sua API
    let partidaIniciada = false;

    function exibirMensagem(mensagem) {
        mensagemDiv.textContent = mensagem;
    }

    // Verifica se a partida foi iniciada
    async function verificarPartidaIniciada() {
        try {
            const response = await fetch(`${apiUrl}/partidaIniciada`);
            const data = await response.json();
            partidaIniciada = data.jogoIniciado === 'true'; // Ajuste com base na resposta da API

            // Atualiza o estado do botão de finalizar com base na partida
            if (partidaIniciada) {
                btnFinalizar.disabled = false;
            } else {
                btnFinalizar.disabled = true;
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

    async function proximoJogador() {
        try {
            const response = await fetch(`${apiUrl}/proximoJogador`);
            const data = await response.json();
    
            if (!data || Object.keys(data).length === 0) {
                finalizarJogo(); // Se não houver retorno, finaliza o jogo
                return;
            }
    
            exibirMensagem(data.mensagem);
            atualizarInformacoes();  // Atualiza as informações após a mudança de turno
        } catch (error) {
            atualizarInformacoes();
            finalizarJogo();
        }
    }

    function finalizarJogo() {
        if (partidaIniciada) {
            partidaIniciada = true;
            btnFinalizar.disabled = true;
    
            // Desabilitar outros botões do jogo (como os de ação)
            hitButton.disabled = true;
            standButton.disabled = true;
    
            fetch(`${apiUrl}/finalizar`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.text())
            .then(data => {
                alert(data); // Mostrar a mensagem de finalização recebida do servidor
            })
            .catch(error => console.error("Erro ao finalizar jogo:", error))
            .finally(() => {
                setTimeout(() => {
                    partidaIniciada = false;
                    btnFinalizar.disabled = false;
                }, 5000); // Reset do cooldown após 5 segundos
            });
    
            // Opcionalmente, recarregar a página após 1 segundo
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player: { nome: jogadorAtual },
                    jogada: jogada
                })
            });
    
            const data = await response.json();
            exibirMensagem(data.mensagem);
            exibirJogadorAtual();  // Atualiza jogador atual
            exibirCartas();        // Atualiza cartas
    
            // Se o jogador perdeu ou escolheu "stand", chama proximoJogador()
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
    }

    // Verifica se a partida foi iniciada ao carregar a página
    verificarPartidaIniciada();

    // Atualiza informações a cada segundo
    setInterval(atualizarInformacoes, 1000);
    
    atualizarInformacoes();
});
