document.addEventListener("DOMContentLoaded", function() {
    const jogadoresList = document.getElementById('lista-jogadores');
    const jogadorAtualInfo = document.getElementById('jogador-atual-info');
    const cartasInfo = document.getElementById('cartas-info');
    const mensagemDiv = document.getElementById('mensagem');
    const hitButton = document.getElementById('hit');
    const standButton = document.getElementById('stand');
    const btnFinalizar = document.getElementById('btnFinalizar');
    const contadorDisplay = document.getElementById('contador-display');

    const apiUrl = "http://localhost:8080/blackjack/mesas";  // Substitua pela URL da sua API
    let partidaIniciada = false;

    // Variáveis para armazenar o ID da mesa e o token da mesa
    let mesaId = null;
    let mesaToken = null;

    // Função para criar a mesa (será chamada apenas uma vez)
    async function criarMesa() {
        if (!mesaId) { // Só cria a mesa se não existir um ID
            try {
                const response = await fetch("http://localhost:8080/blackjack/criarMesa", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                });

                const data = await response.json();

                // Armazenando o ID da mesa e o token
                mesaId = data.mesaId;
                mesaToken = data.token;

                console.log("Mesa criada com sucesso:", data);
                console.log("Mesa ID:", mesaId);
                console.log("Token da mesa:", mesaToken);

                // Atualiza a interface para mostrar que a mesa foi criada
                document.getElementById("mensagem").innerText = `Mesa criada com ID: ${mesaId}`;

                // Agora que a mesa foi criada, chama a função de verificar partida
                verificarPartidaIniciada(); // Chamada aqui, após o mesaId ser definido
            } catch (error) {
                console.error("Erro ao criar mesa:", error);
            }
        }
    }

    function exibirMensagem(mensagem) {
        mensagemDiv.textContent = mensagem;
    }

    async function verificarPartidaIniciada() {
        // Verifica se o mesaId foi definido
        if (!mesaId) {
            exibirMensagem("ID da mesa não definido.");
            return; // Se o mesaId não for válido, a função não faz nada
        }

        try {
            // Faz a requisição usando o mesaId
            const response = await fetch(`${apiUrl}/${mesaId}`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${mesaToken}`  // Adiciona o token de autorização
                }
            });
            const data = await response.json();
            console.log(data);

            // Verifica se o valor de 'jogoIniciado' é true
            if (data.jogoIniciado === true) {
                partidaIniciada = true; // A partida foi iniciada
                btnFinalizar.disabled = false; // Habilita o botão de finalizar
                // Chama as funções de exibição após a partida ser iniciada
                listarJogadores();
                exibirJogadorAtual();
                exibirCartas();
            } else {
                partidaIniciada = false;  // A partida não foi iniciada ainda
                btnFinalizar.disabled = true; // Desabilita o botão de finalizar
            }
        } catch (error) {
            exibirMensagem("Erro ao verificar o estado da partida.");
        }
    }

    async function listarJogadores() {
        try {
            const response = await fetch(`${apiUrl}/${mesaId}/jogadores`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${mesaToken}`  // Adiciona o token de autorização
                }
            });
            const jogadores = await response.json();
            jogadoresList.innerHTML = jogadores.map(player => `<li>${player.name}</li>`).join('');
        } catch (error) {
            exibirMensagem("Erro ao carregar jogadores.");
        }
    }

    async function exibirJogadorAtual() {
        try {
            const response = await fetch(`${apiUrl}/${mesaId}/jogadoratual`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${mesaToken}`  // Adiciona o token de autorização
                }
            });
            const jogadoresAtuais = await response.json();
            if (jogadoresAtuais.length > 0) {
                jogadorAtualInfo.textContent = jogadoresAtuais[0].nome;
            } else {
                finalizarJogo(); // Finaliza automaticamente quando não há jogadores
            }
        } catch (error) {
            finalizarJogo(); // Também finaliza em caso de erro
        }
    }

    async function exibirCartas() {
        try {
            const response = await fetch(`${apiUrl}/${mesaId}/cartas`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${mesaToken}`  // Adiciona o token de autorização
                }
            });
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
            hitButton.disabled = true;
            standButton.disabled = true;

            fetch(`${apiUrl}/${mesaId}/finalizar`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${mesaToken}`  // Adiciona o token de autorização
                }
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
            })
            .catch(error => console.error("Erro ao finalizar jogo:", error));

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
            const response = await fetch(`${apiUrl}/${mesaId}/jogada`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${mesaToken}`  // Adiciona o token de autorização
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

            if (jogada === 'stand'){
                proximoJogador();
            }

            if (jogada === 'hit' && data.pontuacao > 21) {
                atualizarInformacoes();
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

    // Funções relacionadas ao contador

    let contador = 16;
    let intervaloContador;

    function iniciarContagem() {
        intervaloContador = setInterval(function() {
            contador--;
            console.log(contador); // Verifica se o contador está diminuindo corretamente
            contadorDisplay.textContent = `Tempo: ${contador} segundos`;

            if (contador === 0) {
                // Aqui você pode adicionar a lógica que deseja quando o contador chegar a zero
                contador = 16
            }
        }, 1000);
    }

    

    // Inicia a contagem quando a página carrega
    iniciarContagem();

    // Inicia a atualização automática a cada 1 segundo
    const intervaloAtualizacao = setInterval(atualizarInformacoes, 2500);

    criarMesa();
});