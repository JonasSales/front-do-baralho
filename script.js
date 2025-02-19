const API_URL = "http://localhost:8080/blackjack";
let playerName;
let jogoIniciado = false;  // Variável global para verificar se o jogo foi iniciado

// Adicionar jogador
function addPlayer() {
    const playerName = document.getElementById("player-name").value;
    console.log("Tentando adicionar jogador:", playerName);

    if (!playerName) {
        alert("Digite um nome válido.");
        console.log("Nome do jogador inválido.");
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
        console.log("Resposta do servidor (adicionar jogador):", data);
        document.getElementById("player-name").value = "";
        listPlayers();
    })
}

// Listar jogadores
function listPlayers() {
    console.log("Buscando jogadores...");

    fetch(`${API_URL}/jogadores`)
        .then(response => response.json())
        .then(players => {
            console.log("Jogadores recebidos:", players);
            const playerList = document.getElementById("player-list");
            playerList.innerHTML = "";
            players.forEach(player => {
                const li = document.createElement("li");
                li.textContent = player.nome;
                playerList.appendChild(li);
            });

            // Verifica se o jogo pode ser iniciado (pelo menos 2 jogadores)
            if (players.length >= 2 && !jogoIniciado) {
                jogoIniciado = true;  // Inicia o jogo
                alert("Jogo iniciado com sucesso!");
                startGame();
            }
        })
        .then(() => jogadorAtual());  // Atualiza o jogador atual após listar os jogadores
}

// Iniciar jogo
function startGame() {
    console.log("Iniciando o jogo...");

    fetch(`${API_URL}/iniciar`, { method: "POST" })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            console.log("Resposta do servidor (iniciar jogo):", data);
        })
        .then(() => jogadorAtual());  // Atualiza o jogador atual após iniciar o jogo
}

// Mostrar cartas
function getCards() {
    console.log("Buscando cartas...");

    fetch(`${API_URL}/cartas`)
        .then(response => response.json())
        .then(cards => {
            console.log("Cartas recebidas:", cards);
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
        })
        .then(() => jogadorAtual());  // Atualiza o jogador atual após mostrar as cartas
}

// Jogador Atual
function jogadorAtual() {
    if (!jogoIniciado) {
        console.log("Jogo ainda não iniciado. Aguardando jogadores.");
        return;
    }

    console.log("Buscando jogador atual...");

    return fetch(`${API_URL}/jogadoratual`)
        .then(response => response.json())
        .then(players => {
            const player = players[0];
            console.log("Jogador atual:", player);

            if (player.pontuacao > 21) {
                console.log("Pontuação do jogador maior que 21. Passando para o próximo jogador...");
                return proximoJogador().then(() => jogadorAtual());  // Atualiza o jogador atual após passar para o próximo jogador
            }

            const display = document.getElementById("jogador-atual");
            display.innerHTML = `<h3>${player.nome}</h3>`;
            return player.data;
        })
        .catch(error => {
            console.error('Erro ao buscar jogador:', error);
            finalizarJogo();
            return false;
        });
}

// Finalizar jogo
function finalizarJogo() {
    console.log("Finalizando o jogo...");
    jogoIniciado = false;  // Define o jogo como não iniciado

    fetch(`${API_URL}/finalizar`)
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            console.log("Resposta do servidor (finalizar jogo):", data);
        })
        .catch(error => console.error('Erro ao finalizar jogo:', error));
}

// Enviar jogada
function enviarJogada(jogada) {
    const playerName = document.getElementById("jogador-atual").textContent.trim();
    console.log(`Enviando jogada: ${jogada} para o jogador ${playerName}`);

    fetch(`${API_URL}/jogada`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            player: { nome: playerName },
            jogada: jogada,
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensagem);
        console.log("Resposta do servidor (enviar jogada):", data);

        if (jogada === 'stand') {
            jogadorAtual().then(isJogadorAtual => {
                if (!isJogadorAtual) {
                    alert("Não há mais jogadores. O jogo será finalizado.");
                    finalizarJogo();
                } else {
                    jogadorAtual();
                }
            });
        }
        getCards();
    })
    .then(() => jogadorAtual());  // Atualiza o jogador atual após enviar a jogada
}

// Proximo Jogador
function proximoJogador() {
    console.log("Buscando próximo jogador...");

    return fetch(`${API_URL}/proximoJogador`)
        .then(response => response.json())
        .then(player => {
            if (player) {
                console.log("Próximo jogador:", player);
                return true;
            } else {
                alert("Não há mais jogadores disponíveis.");
                finalizarJogo();
                return false;
            }
        })
        .then(() => jogadorAtual())  // Atualiza o jogador atual após buscar o próximo jogador
        .catch(error => {
            console.error('Erro ao buscar próximo jogador:', error);
            alert("Erro ao buscar próximo jogador.");
            finalizarJogo();
            return false;
        });
}


// Atualiza a lista de jogadores ao carregar
document.addEventListener("DOMContentLoaded", () => {
    console.log("Página carregada, atualizando lista de jogadores...");
    listPlayers();
});
