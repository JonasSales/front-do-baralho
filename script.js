const API_URL = "http://localhost:8080/blackjack";

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
}

// Comprar carta
function buyCard() {
    const playerName = document.getElementById("player-action").value;
    if (!playerName) {
        alert("Digite um nome válido.");
        return;
    }

    fetch(`${API_URL}/comprar/${playerName}`, { method: "POST" })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            getCards();
        });
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

// Finalizar jogo
function endGame() {
    fetch(`${API_URL}/finalizar`)
        .then(response => response.json())
        .then(data => alert(data.message));
}

// Atualiza a lista de jogadores ao carregar
document.addEventListener("DOMContentLoaded", listPlayers);
