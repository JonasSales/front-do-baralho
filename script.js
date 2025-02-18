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
    return fetch(`${API_URL}/proximoJogador`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta da API');
            }

            // Verifica se a resposta não está vazia
            return response.text().then(text => {
                if (text.trim() === "") {
                    throw new Error('Não há mais jogadores disponíveis');
                }
                return JSON.parse(text); // Parse manual se a resposta não for JSON válido
            });
        })
        .then(player => {
            const display = document.getElementById("jogador-atual");
            display.innerHTML = "";  // Limpa o conteúdo antes de adicionar o novo jogador
            if (player && player.nome) {
                const playerDiv = document.createElement("div");
                playerDiv.innerHTML = `
                    <h3>${player.nome}</h3>
                `;
                display.appendChild(playerDiv);
                return true;  // Retorna true se jogador encontrado
            } else {
                console.error('Dados do jogador estão incompletos ou ausentes');
                return false;  // Retorna false se não tiver dados completos
            }
        })
        .catch(error => {
            console.error('Erro ao buscar jogador:', error);
            alert("Não há mais jogadores disponíveis. O jogo será finalizado.");
            finalizarJogo();  // Função que finaliza o jogo
            return false;  // Retorna false em caso de erro ou falta de jogadores
        });
}


// Finalizar jogo
function finalizarJogo() {
    fetch(`${API_URL}/finalizar`)
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => {
            console.error('Erro ao finalizar jogo:', error);
            alert("Erro ao finalizar o jogo.");
        });
        window.location.reload();
}


function enviarJogada(jogada) {
    const playerName = document.getElementById("jogador-atual").textContent.trim().split("\n");
    console.log(jogada);
    console.log(playerName);

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
        alert(data.mensagem); // Exibe a mensagem de resposta
        
        if (jogada === 'stand') {
            // Chama a função jogadorAtual() se a jogada for "stand"
            jogadorAtual().then(isJogadorAtual => {
                if (!isJogadorAtual) {
                    alert("Não há mais jogadores. O jogo será finalizado.");
                    finalizarJogo();
                } else {
                    // Caso o jogador atual seja válido, chama a função novamente
                    jogadorAtual(); // Atualiza o jogador atual
                }
            });
        }

        if (jogada === 'hit') {
            
        }
        
        getCards(); // Atualiza as cartas após a jogada
    })
    .catch(error => console.error("Erro ao enviar jogada:", error));
}


// Atualiza a lista de jogadores ao carregar
document.addEventListener("DOMContentLoaded", listPlayers);
