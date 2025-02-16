// Função para atualizar o nome do jogador atual
function atualizarJogadorAtual(jogadorAtual) {
    const jogadorAtualElement = document.getElementById("nomeJogadorAtual");
    jogadorAtualElement.textContent = jogadorAtual;
}

// Função para atualizar a lista de jogadores na mesa
function atualizarListaJogadores() {
    fetch('http://localhost:8080/blackjack/jogadores', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(jogadores => {
        const listaJogadoresElement = document.getElementById("listaJogadores");
        listaJogadoresElement.innerHTML = ''; // Limpa a lista antes de atualizá-la

        jogadores.forEach(jogador => {
            const li = document.createElement("li");
            li.textContent = jogador.nome;
            listaJogadoresElement.appendChild(li);
        });
    })
    .catch(error => console.error('Erro ao buscar jogadores:', error));
}

// Função para exibir as cartas dos jogadores
function exibirCartasJogadores() {
    fetch('http://localhost:8080/blackjack/cartas', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(cartasPorJogador => {
        const cartasJogadoresElement = document.getElementById("cartasJogadores");
        cartasJogadoresElement.innerHTML = ''; // Limpa a lista de cartas antes de atualizá-la

        for (const jogador in cartasPorJogador) {
            const div = document.createElement("div");
            div.classList.add("cartas-jogador");

            const jogadorNome = document.createElement("h3");
            jogadorNome.textContent = jogador;
            div.appendChild(jogadorNome);

            const listaCartas = document.createElement("ul");
            cartasPorJogador[jogador].forEach(carta => {
                const li = document.createElement("li");
                li.textContent = carta;
                listaCartas.appendChild(li);
            });

            div.appendChild(listaCartas);
            cartasJogadoresElement.appendChild(div);
        }
    })
    .catch(error => console.error('Erro ao buscar cartas:', error));
}

// Função para adicionar jogador
document.getElementById("adicionarJogadorBtn").addEventListener("click", function() {
    const nomeJogador = document.getElementById("nomeJogador").value;

    if (nomeJogador.trim() === "") {
        alert("Por favor, insira o nome do jogador.");
        return;
    }

    fetch('http://localhost:8080/blackjack/adicionar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nomeJogador
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        // Atualiza o jogador atual e a lista de jogadores após adicionar um jogador
        if (data.message.includes("adicionado")) {
            atualizarJogadorAtual(data.jogadorAtual);
            atualizarListaJogadores();
        }
    })
    .catch(error => console.error('Erro ao adicionar jogador:', error));
});

// Função para iniciar o jogo
document.getElementById("iniciarJogo").addEventListener("click", function() {
    fetch('http://localhost:8080/blackjack/iniciar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Jogo iniciado! Cartas distribuídas!") {
            // Atualiza o jogador atual
            atualizarJogadorAtual(data.jogadorAtual);
            // Exibe um alerta de sucesso ao iniciar o jogo
            alert("Jogo iniciado! Cartas foram distribuídas.");
        } else {
            alert(data.message);
        }
        // Atualiza a lista de jogadores após iniciar o jogo
        atualizarListaJogadores();
        // Exibe as cartas dos jogadores após o jogo ser iniciado
        exibirCartasJogadores();
    })
    .catch(error => console.error('Erro ao iniciar jogo:', error));
});

// Função para comprar uma carta
document.getElementById("comprarCarta").addEventListener("click", function() {
    const nomeJogador = prompt("Digite o nome do jogador para comprar carta:");

    fetch(`http://localhost:8080/blackjack/comprar/${nomeJogador}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        // Atualiza o jogador atual após a ação
        atualizarJogadorAtual(data.jogadorAtual);
        // Atualiza a lista de jogadores após a compra de carta
        atualizarListaJogadores();
        // Exibe as cartas dos jogadores após comprar uma carta
        exibirCartasJogadores();
    })
    .catch(error => console.error('Erro ao comprar carta:', error));
});

// Função para finalizar o jogo
document.getElementById("finalizarJogo").addEventListener("click", function() {
    fetch('http://localhost:8080/blackjack/finalizar', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        // Atualiza o nome do jogador atual para "Nenhum jogador"
        atualizarJogadorAtual(data.jogadorAtual);
        // Atualiza a lista de jogadores após finalizar o jogo
        atualizarListaJogadores();
        // Limpa as cartas ao finalizar o jogo
        exibirCartasJogadores();
    })
    .catch(error => console.error('Erro ao finalizar jogo:', error));
});

// Inicializa a lista de jogadores e cartas ao carregar a página
document.addEventListener("DOMContentLoaded", function() {
    atualizarListaJogadores();
    exibirCartasJogadores();
});
