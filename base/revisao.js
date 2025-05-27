let gabarito = {};
let ano = null;
let dia = null;
let respostasUsuario = {};
let questoesIds = [];

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    ano = urlParams.get("ano");
    dia = urlParams.get("dia");

    if (!ano || !dia) {
        alert("Ano ou Dia não especificado para revisão!");
        window.location.href = "../index.html";
        return;
    }

    document.getElementById("review-header").textContent = 
        `Revisão - ENEM ${ano.replace("enem", "")} ${dia.replace("dia", "Dia ")}`;

    // Carrega respostas do localStorage
    const savedAnswers = localStorage.getItem(`respostas_${ano}_${dia}`);
    if (savedAnswers) {
        respostasUsuario = JSON.parse(savedAnswers);
    } else {
        // Se não houver respostas salvas, informa e talvez redirecione
        document.getElementById("loading-review").textContent = "Nenhuma resposta encontrada para este simulado.";
        document.getElementById("loading-review").style.color = "orange";
        // return; // Pode parar aqui ou carregar apenas o gabarito
    }

    // Adiciona listener ao botão de busca
    document.getElementById("search-button").addEventListener("click", buscarQuestao);
    document.getElementById("search-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            buscarQuestao();
        }
    });

    carregarGabaritoParaRevisao();
});

function carregarGabaritoParaRevisao() {
    const gabaritoPath = `../${ano}/${dia}/gabarito_${dia}.json`;
    fetch(gabaritoPath)
        .then(res => {
            if (!res.ok) throw new Error(`Gabarito não encontrado para ${ano} ${dia}.`);
            return res.json();
        })
        .then(data => {
            if (typeof data !== "object" || data === null || Object.keys(data).length === 0) {
                throw new Error("Formato inválido ou gabarito vazio.");
            }
            gabarito = data;
            questoesIds = Object.keys(gabarito).sort((a, b) => parseInt(a) - parseInt(b));
            exibirRevisao();
        })
        .catch(err => {
            console.error("Erro ao carregar gabarito para revisão:", err);
            document.getElementById("loading-review").textContent = 
                `Erro ao carregar gabarito: ${err.message}`;
            document.getElementById("loading-review").style.color = "red";
        });
}

// Função para carregar imagens (igual à do simulado.js, pode ser refatorada para um arquivo comum no futuro)
function carregarImagensQuestaoReview(numeroQuestao, containerImagens) {
    containerImagens.innerHTML = "; // Limpa imagens anteriores
    const numeroSemZero = parseInt(numeroQuestao, 10).toString();
    const basePath = `../${ano}/${dia}/imagens/q${numeroSemZero}`;
    let sufixoCharCode = 97; // 'a'
    let algumaImagemCarregada = false;

    function tentarCarregar(path, altText) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = path;
            img.alt = altText;
            img.onload = () => {
                containerImagens.appendChild(img);
                algumaImagemCarregada = true;
                resolve(true);
            };
            img.onerror = () => resolve(false);
        });
    }

    tentarCarregar(`${basePath}.jpeg`, `Questão ${numeroQuestao}`).then(baseCarregada => {
        function tentarCarregarSufixo() {
            const sufixo = String.fromCharCode(sufixoCharCode);
            tentarCarregar(`${basePath}${sufixo}.jpeg`, `Questão ${numeroQuestao}${sufixo}`).then(sufixoCarregado => {
                if (sufixoCarregado) {
                    sufixoCharCode++;
                    tentarCarregarSufixo();
                } else {
                    if (!baseCarregada && sufixoCharCode === 97 && !algumaImagemCarregada) {
                        const aviso = document.createElement("p");
                        aviso.textContent = `[Imagem(ns) não encontrada(s) para questão ${numeroQuestao}]`;
                        aviso.style.color = "orange";
                        containerImagens.appendChild(aviso);
                    }
                }
            });
        }
        tentarCarregarSufixo();
    });
}

function exibirRevisao() {
    const reviewArea = document.getElementById("review-area");
    reviewArea.innerHTML = "; // Limpa a área de revisão
    let acertos = 0;

    questoesIds.forEach(numero => {
        const divQuestao = document.createElement("div");
        divQuestao.className = "question-review";
        divQuestao.id = `review-q${numero}`;

        // Badge com número da questão
        const badge = document.createElement("span");
        badge.className = "question-number-badge";
        badge.textContent = `Questão ${numero}`;
        divQuestao.appendChild(badge);

        const divImagens = document.createElement("div");
        divImagens.className = "imagens-questao-review";
        divQuestao.appendChild(divImagens);
        carregarImagensQuestaoReview(numero, divImagens);

        const divInfo = document.createElement("div");
        divInfo.className = "review-info";

        const respostaUsuario = respostasUsuario[numero] || "(Não respondida)";
        const respostaCorreta = gabarito[numero];
        const isCorrect = respostaUsuario.toUpperCase() === respostaCorreta.toUpperCase();

        let statusTexto = "";
        let statusClass = "";

        if (respostaUsuario === "(Não respondida)") {
            statusTexto = "Não respondida";
            statusClass = ""; // Sem classe de cor específica
        } else if (isCorrect) {
            statusTexto = "Correta";
            statusClass = "correct";
            divQuestao.classList.add("correct");
            acertos++;
        } else {
            statusTexto = "Incorreta";
            statusClass = "incorrect";
            divQuestao.classList.add("incorrect");
        }

        divInfo.innerHTML = `
            Sua Resposta: <span class="user-answer ${statusClass}">${respostaUsuario}</span> <br>
            Resposta Correta: <span class="correct-answer">${respostaCorreta}</span>
        `;

        divQuestao.appendChild(divInfo);
        reviewArea.appendChild(divQuestao);
    });

    // Adiciona contagem de acertos no cabeçalho (opcional)
    const score = document.createElement("p");
    score.style.textAlign = "center";
    score.style.fontSize = "1.2em";
    score.innerHTML = `Resultado Final: <strong>${acertos} de ${questoesIds.length}</strong> questões corretas.`;
    reviewArea.insertBefore(score, reviewArea.firstChild);

    document.getElementById("loading-review").style.display = "none";
}

function buscarQuestao() {
    const input = document.getElementById("search-input");
    const numeroBusca = input.value.trim();
    if (!numeroBusca) return;

    // Formata o número para ter 3 dígitos com zeros à esquerda se necessário (para corresponder ao ID do gabarito)
    const numeroFormatado = numeroBusca.padStart(3, '0'); 

    const targetElement = document.getElementById(`review-q${numeroFormatado}`);

    if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Adiciona um destaque temporário (opcional)
        targetElement.style.transition = 'background-color 0.5s ease';
        targetElement.style.backgroundColor = '#333'; // Cor de destaque
        setTimeout(() => {
            targetElement.style.backgroundColor = ''; // Remove destaque
        }, 1500);
    } else {
        alert(`Questão ${numeroBusca} não encontrada nesta revisão.`);
    }
    input.value = ''; // Limpa o campo após a busca
}

