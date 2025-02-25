document.addEventListener('DOMContentLoaded', function () {
    const mesaIdElement = document.getElementById('mesa-id');
    const jogadoresCountElement = document.getElementById('jogadores-count');
    const sairMesaButton = document.getElementById('sair-mesa');

    // Captura o mesaId da URL
    const urlParams = new URLSearchParams(window.location.search);
    const mesaId = urlParams.get('mesaId');

    if (!mesaId) {
        alert('Mesa não encontrada.');
        window.location.href = '/index.html';
        return;
    }

    // Exibe o ID da mesa
    mesaIdElement.textContent = mesaId;

    // Função para carregar os dados da mesa
    async function carregarMesa() {
        const tokenMesa = localStorage.getItem('tokenMesa'); // Token da mesa
        if (!tokenMesa) {
            alert('Token da mesa não encontrado.');
            window.location.href = '/index.html';
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}`, {
                headers: {
                    'Authorization': `Bearer ${tokenMesa}` // Envia o token da mesa
                }
            });
    
            if (!response.ok) {
                throw new Error('Erro ao carregar a mesa');
            }
    
            const mesa = await response.json();
            jogadoresCountElement.textContent = mesa.quantidadeDeJogadores;
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar a mesa. Tente novamente.');
        }
    }

    // Função para sair da mesa
    sairMesaButton.addEventListener('click', async () => {
        const tokenJogador = localStorage.getItem('token'); // Token do usuário
        if (!tokenJogador) {
            alert('Você precisa estar logado para sair da mesa.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/blackjack/mesas/${mesaId}/sair`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenJogador}`, // Envia o token do usuário
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao sair da mesa');
            }

            const result = await response.json();
            alert(result.message);
            window.location.href = '/index.html'; // Redireciona para a página inicial
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao sair da mesa. Tente novamente.');
        }
    });

    // Carrega os dados da mesa ao abrir a página
    carregarMesa();
});