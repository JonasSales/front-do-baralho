const API_URL = "http://localhost:8080/blackjack";
let playerName;

// Adicionar jogador
function addPlayer() {
    const playerName = document.getElementById("player-name").value;
    if (!playerName) {
        alert("Digite um nome válido.");
        return;
    }

    fetch(`${API_URL}/adicionar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: playerName })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById("player-name").value = "";
        listPlayers();
    });
}

// Listar jogadores
function listPlayers() {
    fetch(`${API_URL}/jogadores`)
        .then(response => response.json())
        .then(players => {
            const playerList = document.getElementById("player-list");
            playerList.innerHTML = "";
            players.forEach(player => {
                const li = document.createElement("li");
                li.textContent = player.nome;
                playerList.appendChild(li);
            });
        });
}

// Iniciar jogo
function startGame() {
    fetch(`${API_URL}/iniciar`, { method: "POST" })
        .then(response => response.json())
        .then(data => alert(data.message));
    jogadorAtual();
}

// Mostrar cartas
function getCards() {
    fetch(`${API_URL}/cartas`)
        .then(response => response.json())
        .then(cards => {
            const display = document.getElementById("card-display");
            display.innerHTML = "";
            for (const player in cards) {
                const playerDiv = document.createElement("div");
                playerDiv.innerHTML = `<h3>${player}</h3>`;
                cards[player].forEach(card => {
                    const cardDiv = document.createElement("div");
                    cardDiv.className = "card";
                    cardDiv.textContent = card;
                    playerDiv.appendChild(cardDiv);
                });
                display.appendChild(playerDiv);
            }
        });
}

// Jogador Atual
function jogadorAtual() {
    return fetch(`${API_URL}/jogadoratual`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta da API');
            }

            return response.json();  // Fazendo o parse para JSON diretamente
        })
        .then(players => {
            if (!Array.isArray(players) || players.length === 0) {
                throw new Error('Nenhum jogador encontrado');
            }

            const player = players[0];  // Assume-se que o primeiro jogador é o atual
            // Verifica se o jogador tem pontuação maior que 21
            if (player.pontuacao > 21) {
                proximoJogador();  // Avança para o próximo jogador
                return jogadorAtual();
            }

            // Exibe o nome do jogador, já que sua pontuação é válida
            const display = document.getElementById("jogador-atual");
            display.innerHTML = "";  // Limpa o conteúdo antes de adicionar o novo jogador

            if (player && player.nome) {
                const playerDiv = document.createElement("div");
                playerDiv.innerHTML = `
                    <h3>${player.nome}</h3>
                `;
                display.appendChild(playerDiv);
                return player.data;  // Retorna true se jogador encontrado e com pontuação válida
            } else {
                console.error('Dados do jogador estão incompletos ou ausentes');
                return null;  // Retorna false se não tiver dados completos
            }
        })
        .catch(error => {
            console.error('Erro ao buscar jogador:', error);
            console.log("FInalizou1")
            finalizarJogo();  // Função que finaliza o jogo
            return false;  // Retorna false em caso de erro ou falta de jogador
        });
}


// Finalizar jogo
function finalizarJogo() {
    fetch(`${API_URL}/finalizar`)
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => {
            console.error('Erro ao finalizar jogo:', error);
        });
    //window.location.reload();
}

// Enviar jogada
function enviarJogada(jogada) {
    const playerName = document.getElementById("jogador-atual").textContent.trim(); // Garantir que seja uma string

    console.log(jogada);
    console.log(playerName);

    fetch(`${API_URL}/jogada`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            player: { nome: playerName }, // Garante que seja uma string válida
            jogada: jogada,
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensagem); // Exibe a mensagem de resposta
        
        if (jogada === 'stand') {
            jogadorAtual().then(isJogadorAtual => {
                if (!isJogadorAtual) {
                    alert("Não há mais jogadores. O jogo será finalizado.");
                    finalizarJogo();
                } else {
                    jogadorAtual(); // Atualiza o jogador atual
                }
            });
        }

        if (jogada === 'hit'){
            
        }

        getCards(); // Atualiza as cartas após a jogada
    })
    .catch(error => console.error("Erro ao enviar jogada:", error));
}







// Proximo Jogador
function proximoJogador() {
    return fetch(`${API_URL}/proximoJogador`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta da API');
            }

            return response.text().then(text => {
                if (text.trim() === "") {
                    throw new Error('Não há mais jogadores disponíveis');
                }
                return JSON.parse(text); // Parse manual se a resposta não for JSON válido
            });
        })
        .then(player => {
            // Caso haja um jogador, apenas redireciona para o próximo jogador
            if (player && player.nome) {
                jogadorAtual();  // Chama novamente a função para exibir o próximo jogador
                return true;  // Retorna true se jogador encontrado
            } else {
                console.error('Não há mais jogadores disponíveis');
                throw new Error('Não há mais jogadores disponíveis');
            }
        })
        .catch(error => {
            console.error('Erro ao buscar próximo jogador:', error);
            alert("Não há mais jogadores disponíveis. O jogo será finalizado.");
            console.log("FInalizou4")
            finalizarJogo();  // Função que finaliza o jogo
            return false;  // Retorna false em caso de erro ou falta de jogadores
        });
}

// Atualiza a lista de jogadores ao carregar
document.addEventListener("DOMContentLoaded", listPlayers);
