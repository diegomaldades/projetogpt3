let gabarito = {};
let ano = null;

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    ano = urlParams.get("ano");

    if (!ano) {
        alert("Ano não especificado!");
        // Redireciona para a página inicial se o ano não for encontrado
        window.location.href = "../index.html";
        return; // Interrompe a execução se não houver ano
    }

    // Define o título da página com o ano
    document.title = `Simulado ENEM ${ano.replace('enem', '')}`;
    document.getElementById('simulado-title').textContent = `Simulado ENEM ${ano.replace('enem', '')}`;

    carregarGabarito();
});

function carregarGabarito() {
    const gabaritoPath = `../${ano}/gabarito.json`;
    fetch(gabaritoPath)
        .then(res => {
            if (!res.ok) {
                // Se o gabarito não for encontrado, informa o usuário e redireciona
                throw new Error(`Gabarito para ${ano} não encontrado.`);
            }
            return res.json();
        })
        .then(data => {
            // Verifica se o gabarito tem o formato esperado (um objeto)
            if (typeof data !== 'object' || data === null) {
                throw new Error("Formato inválido do gabarito.");
            }
            gabarito = data;
            // Verifica se o gabarito não está vazio
            if (Object.keys(gabarito).length === 0) {
                throw new Error("Gabarito vazio ou inválido.");
            }
            carregarQuestoes();
        })
        .catch(err => {
            console.error("Erro ao carregar gabarito:", err);
            alert(`Erro ao carregar o simulado: ${err.message}\nVerifique se os arquivos do ano ${ano} existem e estão corretos.`);
            // Opcional: redirecionar ou mostrar mensagem mais elaborada
            // window.location.href = "../index.html";
        });
}

// Função para carregar imagens de uma questão, incluindo partes múltiplas
function carregarImagensQuestao(numeroQuestao, containerImagens) {
    const basePath = `../${ano}/imagens/q${numeroQuestao}`;
    let sufixoCharCode = 97; // Código ASCII para 'a'
    let algumaImagemCarregada = false;

    // Função interna para tentar carregar uma imagem específica
    function tentarCarregar(path, altText) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.alt = altText;
            img.onload = () => {
                containerImagens.appendChild(img);
                algumaImagemCarregada = true;
                resolve(true);
            };
            img.onerror = () => {
                resolve(false); // Resolve como false se a imagem não carregar
            };
        });
    }

    // Tenta carregar a imagem base primeiro
    tentarCarregar(`${basePath}.jpeg`, `Questão ${numeroQuestao}`).then(baseCarregada => {
        // Função recursiva para tentar carregar sufixos 'a', 'b', 'c', ...
        function tentarCarregarSufixo() {
            const sufixo = String.fromCharCode(sufixoCharCode);
            tentarCarregar(`${basePath}${sufixo}.jpeg`, `Questão ${numeroQuestao}${sufixo}`).then(sufixoCarregado => {
                if (sufixoCarregado) {
                    sufixoCharCode++;
                    tentarCarregarSufixo(); // Tenta o próximo sufixo
                } else {
                    // Se a base não carregou E o sufixo 'a' também não, mostra aviso
                    if (!baseCarregada && sufixoCharCode === 97 && !algumaImagemCarregada) {
                        const aviso = document.createElement("p");
                        aviso.textContent = `[Imagem(ns) não encontrada(s) para questão ${numeroQuestao}]`;
                        aviso.style.color = "orange";
                        containerImagens.appendChild(aviso);
                    }
                }
            });
        }
        // Inicia a tentativa de carregar sufixos
        tentarCarregarSufixo();
    });
}

function carregarQuestoes() {
    const container = document.getElementById("questoes");
    container.innerHTML = ''; // Limpa questões anteriores
    const totalQuestoes = Object.keys(gabarito).length;

    if (totalQuestoes === 0) {
        container.innerHTML = '<p style="color: red;">Nenhuma questão encontrada no gabarito.</p>';
        return;
    }

    // Itera usando as chaves do gabarito para garantir a ordem correta
    // Assumindo que as chaves no JSON estão como "1", "2", ... "90"
    const numerosQuestoes = Object.keys(gabarito).sort((a, b) => parseInt(a) - parseInt(b));

    numerosQuestoes.forEach(numero => {
        const divQuestao = document.createElement("div");
        divQuestao.className = "question";
        divQuestao.id = `questao-${numero}`;

        const titulo = document.createElement("h3");
        titulo.textContent = `Questão ${numero}`;
        divQuestao.appendChild(titulo);

        const divImagens = document.createElement("div");
        divImagens.className = "imagens-questao"; // Classe para estilização se necessário
        divQuestao.appendChild(divImagens);

        // Carrega as imagens da questão (convertendo o número para remover zeros à esquerda)
        carregarImagensQuestao(parseInt(numero, 10).toString(), divImagens);

        // Adiciona o seletor de resposta
        const label = document.createElement("label");
        label.textContent = "Resposta: ";
        const select = document.createElement("select");
        // Usa o número da questão (que é a chave do gabarito) como ID
        select.id = `q${numero}`;
        select.name = `resposta_q${numero}`;
        // Adiciona opções
        ["--", "A", "B", "C", "D", "E"].forEach(optValue => {
            const option = document.createElement("option");
            option.value = optValue === "--" ? "" : optValue;
            option.textContent = optValue;
            select.appendChild(option);
        });
        label.appendChild(select);
        divQuestao.appendChild(document.createElement("br"));
        divQuestao.appendChild(label);

        container.appendChild(divQuestao);
    });
}

function verificarRespostas() {
    let acertos = 0;
    const total = Object.keys(gabarito).length;
    let respostasUsuario = {};

    if (total === 0) {
        alert("Não há questões para verificar.");
        return;
    }

    Object.keys(gabarito).forEach(numero => {
        const select = document.getElementById(`q${numero}`);
        const respostaSelecionada = select ? select.value : ""; // Obtém a resposta do select
        respostasUsuario[numero] = respostaSelecionada;

        // Compara com o gabarito (case-insensitive pode ser útil)
        if (respostaSelecionada && gabarito[numero] && respostaSelecionada.toUpperCase() === gabarito[numero].toUpperCase()) {
            acertos++;
            // Opcional: Adicionar feedback visual (ex: mudar borda do div da questão)
            document.getElementById(`questao-${numero}`)?.classList.add('correct');
            document.getElementById(`questao-${numero}`)?.classList.remove('incorrect');
        } else if (respostaSelecionada) {
            // Opcional: Adicionar feedback visual para erro
            document.getElementById(`questao-${numero}`)?.classList.add('incorrect');
            document.getElementById(`questao-${numero}`)?.classList.remove('correct');
        } else {
             // Opcional: Remover classes se não respondeu
             document.getElementById(`questao-${numero}`)?.classList.remove('correct', 'incorrect');
        }
    });

    // Exibe o resultado
    alert(`Você acertou ${acertos} de ${total} questões.`);

    // Aqui você poderia exibir um resumo mais detalhado em vez do alert
    // console.log("Respostas do usuário:", respostasUsuario);
    // console.log("Gabarito:", gabarito);
}

// Adiciona listener ao botão de verificar
document.addEventListener('DOMContentLoaded', () => {
    const btnVerificar = document.getElementById('verificarBtn');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', verificarRespostas);
    } else {
        console.error('Botão de verificação não encontrado.');
    }
});
