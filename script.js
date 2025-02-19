document.addEventListener("DOMContentLoaded", function() {
    const jogadoresList = document.getElementById('lista-jogadores');
    const jogadorAtualInfo = document.getElementById('jogador-atual-info');
    const cartasInfo = document.getElementById('cartas-info');
    const mensagemDiv = document.getElementById('mensagem');
    const hitButton = document.getElementById('hit');
    const standButton = document.getElementById('stand');

    const apiUrl = "http://localhost:8080/blackjack";  // Substitua pela URL da sua API

    function exibirMensagem(mensagem) {
        mensagemDiv.textContent = mensagem;
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
            if (jogadoresAtuais.length > 0) {
                jogadorAtualInfo.textContent = jogadoresAtuais[0].nome;
            } else {
                jogadorAtualInfo.textContent = "Não há jogador atual.";
            }
        } catch (error) {
            exibirMensagem("Erro ao carregar o jogador atual.");
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
                finalizarJogo(); // Chama a função para finalizar o jogo
                return;
            }
    
            exibirMensagem(data.mensagem);
            atualizarInformacoes(); // Atualiza as informações após a mudança de turno
        } catch (error) {
            exibirMensagem("Erro ao passar para o próximo jogador.");
        }
    }

    async function finalizarJogo() {
        try {
            const response = await fetch(`${apiUrl}/finalizar`);
            const data = await response.json();
            
            exibirMensagem(data.mensagem || "O jogo foi finalizado.");
            
            // Desativar os botões para impedir novas jogadas
            hitButton.disabled = true;
            standButton.disabled = true;
        } catch (error) {
            exibirMensagem("Erro ao finalizar o jogo.");
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
    }

    setInterval(atualizarInformacoes, 1000);
    
    atualizarInformacoes();
});
