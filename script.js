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

// Comprar carta
function buyCard() {
    const playerName = document.getElementById("jogador-atual").textContent.trim().split("\n")[0];

    if (!playerName) {
        alert("Nome do jogador atual não encontrado.");
        return;
    }

    // Criando o objeto Player com o nome do jogador
    const playerData = {
        nome: playerName
    };

    console.log(JSON.stringify(playerData));

    // Enviando o jogador como JSON no corpo da requisição
    fetch(`${API_URL}/comprar`, {
        
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(playerData)  // Convertendo o objeto para JSON
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        getCards();  // Atualiza as cartas do jogador
    })
    .catch( () => {
        jogadorAtual();
        alert(`${playerName} estourou a mão`);
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

//Jogador Atual
// Jogador Atual
function jogadorAtual() {
    fetch(`${API_URL}/proximoJogador`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta da API');
            }
            return response.json();
        })
        .then(player => {
            const display = document.getElementById("jogador-atual");
            display.innerHTML = "";  // Limpa o conteúdo antes de adicionar o novo jogador
            // Verifique se 'player' contém as propriedades esperadas
            if (player && player.nome) {
                const playerDiv = document.createElement("div");
                // Exibindo as propriedades do jogador
                playerDiv.innerHTML = `
                    <h3>${player.nome}</h3>
                `;
                display.appendChild(playerDiv);
            } else {
                console.error('Dados do jogador estão incompletos ou ausentes');
            }
        })
        .catch(error => {
            console.error('Erro ao buscar jogador:', error);
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
