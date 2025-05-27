let gabarito = {};
let ano = null;
let dia = null;
let questoesIds = [];

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    ano = urlParams.get("ano");
    dia = urlParams.get("dia");

    if (!ano || !dia) {
        alert("Ano ou Dia não especificado para visualizar o gabarito!");
        window.location.href = "../index.html";
        return;
    }

    document.getElementById("gabarito-header").textContent = 
        `Gabarito - ENEM ${ano.replace("enem", "")} ${dia.replace("dia", "Dia ")}`;

    carregarGabaritoParaVisualizacao();
});

function carregarGabaritoParaVisualizacao() {
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
            exibirGabarito();
        })
        .catch(err => {
            console.error("Erro ao carregar gabarito para visualização:", err);
            document.getElementById("loading-gabarito").textContent = 
                `Erro ao carregar gabarito: ${err.message}`;
            document.getElementById("loading-gabarito").style.color = "red";
        });
}

// Função para carregar imagens (similar às outras, pode ser refatorada)
function carregarImagensQuestaoGabarito(numeroQuestao, containerImagens) {
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

function exibirGabarito() {
    const gabaritoArea = document.getElementById("gabarito-area");
    gabaritoArea.innerHTML = "; // Limpa a área

    questoesIds.forEach(numero => {
        const divQuestao = document.createElement("div");
        divQuestao.className = "question-gabarito";
        divQuestao.id = `gabarito-q${numero}`;

        // Badge com número da questão
        const badge = document.createElement("span");
        badge.className = "question-number-badge-gabarito";
        badge.textContent = `Questão ${numero}`;
        divQuestao.appendChild(badge);

        const divImagens = document.createElement("div");
        divImagens.className = "imagens-questao-gabarito";
        divQuestao.appendChild(divImagens);
        carregarImagensQuestaoGabarito(numero, divImagens);

        const divInfo = document.createElement("div");
        divInfo.className = "gabarito-info";

        const respostaCorreta = gabarito[numero];

        divInfo.innerHTML = `
            Resposta Correta: <span class="correct-answer-gabarito">${respostaCorreta}</span>
        `;

        divQuestao.appendChild(divInfo);
        gabaritoArea.appendChild(divQuestao);
    });

    document.getElementById("loading-gabarito").style.display = "none";
}

