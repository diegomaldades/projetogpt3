let gabarito = {};
let ano = null;
let dia = null;
let questoesIds = []; // Array com os IDs das questões (ex: ["1", "2", ... "90"])
let respostasUsuario = {}; // Objeto para armazenar as respostas { "1": "A", "2": "C", ... }
let questaoAtualIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    ano = urlParams.get("ano");
    dia = urlParams.get("dia");

    if (!ano || !dia) {
        alert("Ano ou Dia não especificado!");
        window.location.href = "../index.html";
        return;
    }

    document.getElementById("simulado-header").textContent = 
        `Simulado ENEM ${ano.replace("enem", "")} - ${dia.replace("dia", "Dia ")}`;

    // Adiciona listeners aos botões de navegação
    document.getElementById("prev-button").addEventListener("click", mostrarQuestaoAnterior);
    document.getElementById("next-button").addEventListener("click", mostrarProximaQuestao);
    document.getElementById("finish-button").addEventListener("click", finalizarSimulado);

    // Adiciona listeners aos botões de resposta
    document.querySelectorAll(".answer-button").forEach(button => {
        button.addEventListener("click", () => selecionarResposta(button.dataset.option));
    });

    carregarGabaritoEQuestoes();
});

function carregarGabaritoEQuestoes() {
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
            // Ordena as chaves (números das questões) numericamente
            questoesIds = Object.keys(gabarito).sort((a, b) => parseInt(a) - parseInt(b));
            // Tenta carregar respostas salvas (se houver)
            const savedAnswers = localStorage.getItem(`respostas_${ano}_${dia}`);
            if (savedAnswers) {
                respostasUsuario = JSON.parse(savedAnswers);
            }
            // Inicia exibindo a primeira questão
            mostrarQuestao(questaoAtualIndex);
            document.getElementById("loading-message").style.display = "none";
            document.querySelector(".question-container").style.display = "block";
        })
        .catch(err => {
            console.error("Erro ao carregar gabarito:", err);
            document.getElementById("loading-message").textContent = 
                `Erro ao carregar o simulado: ${err.message}`;
            document.getElementById("loading-message").style.color = "red";
        });
}

// Função para carregar imagens (adaptada de antes)
function carregarImagensQuestao(numeroQuestao, containerImagens) {
    containerImagens.innerHTML = "; // Limpa imagens anteriores
    const numeroSemZero = parseInt(numeroQuestao, 10).toString(); // Garante que não tem zero à esquerda
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

function mostrarQuestao(index) {
    if (index < 0 || index >= questoesIds.length) return;

    questaoAtualIndex = index;
    const numeroQuestao = questoesIds[index];
    
    document.getElementById("question-number").textContent = `Questão ${numeroQuestao}`;
    carregarImagensQuestao(numeroQuestao, document.getElementById("question-images"));

    // Limpa seleção anterior e marca a atual (se houver)
    document.querySelectorAll(".answer-button").forEach(btn => {
        btn.classList.remove("selected");
        if (respostasUsuario[numeroQuestao] === btn.dataset.option) {
            btn.classList.add("selected");
        }
    });

    // Atualiza estado dos botões de navegação
    document.getElementById("prev-button").disabled = index === 0;
    document.getElementById("next-button").style.display = index === questoesIds.length - 1 ? "none" : "inline-block";
    document.getElementById("finish-button").style.display = index === questoesIds.length - 1 ? "inline-block" : "none";

    // Salva progresso no localStorage
    salvarProgresso();
}

function selecionarResposta(opcao) {
    const numeroQuestao = questoesIds[questaoAtualIndex];
    respostasUsuario[numeroQuestao] = opcao;

    // Atualiza visualmente os botões
    document.querySelectorAll(".answer-button").forEach(btn => {
        btn.classList.remove("selected");
        if (btn.dataset.option === opcao) {
            btn.classList.add("selected");
        }
    });

    // Avança para a próxima questão automaticamente (conforme solicitado)
    // Adiciona um pequeno delay para o usuário ver a seleção
    setTimeout(() => {
        if (questaoAtualIndex < questoesIds.length - 1) {
            mostrarProximaQuestao();
        } else {
            // Se for a última questão, apenas salva (não avança)
            salvarProgresso();
        }
    }, 300); // Delay de 300ms
}

function mostrarProximaQuestao() {
    if (questaoAtualIndex < questoesIds.length - 1) {
        mostrarQuestao(questaoAtualIndex + 1);
    }
}

function mostrarQuestaoAnterior() {
    if (questaoAtualIndex > 0) {
        mostrarQuestao(questaoAtualIndex - 1);
    }
}

function salvarProgresso() {
    localStorage.setItem(`respostas_${ano}_${dia}`, JSON.stringify(respostasUsuario));
}

function finalizarSimulado() {
    salvarProgresso(); // Garante que a última resposta foi salva
    // Redireciona para a página de revisão, passando ano e dia
    window.location.href = `revisao.html?ano=${ano}&dia=${dia}`;
}

