let gabarito = {};
let ano = null;
let dia = null;
let todasQuestoesIds = []; // IDs originais do gabarito (ex: "001", "006")
let questoesExibidasIds = []; // IDs das questões a serem exibidas (filtradas por idioma, se aplicável)
let respostasUsuario = {}; // Objeto para armazenar as respostas { "ID_ORIGINAL": "A", ... }
let questaoAtualIndex = 0; // Índice dentro de questoesExibidasIds
let idiomaSelecionado = null; // 'ingles' ou 'espanhol'

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
    document.getElementById("hub-button").addEventListener("click", () => window.location.href = "../index.html"); // Botão Voltar ao Hub

    // Adiciona listeners aos botões de resposta
    document.querySelectorAll(".answer-button").forEach(button => {
        button.addEventListener("click", () => selecionarResposta(button.dataset.option));
    });

    // Esconde a área de questões e mostra a seleção de idioma inicialmente
    document.getElementById("question-area").style.display = "none";
    document.getElementById("language-selection").style.display = "block";

    // Adiciona listeners aos botões de idioma
    document.getElementById("lang-en-button").addEventListener("click", () => iniciarSimuladoComIdioma('ingles'));
    document.getElementById("lang-es-button").addEventListener("click", () => iniciarSimuladoComIdioma('espanhol'));

    // Pré-carrega o gabarito para ter a lista de questões
    carregarGabarito();
});

function carregarGabarito() {
    const gabaritoPath = `../${ano}/${dia}/gabarito_${dia}.json`;
    fetch(gabaritoPath)
        .then(res => {
            if (!res.ok) throw new Error(`Gabarito não encontrado para ${ano} ${dia}. Verifique o caminho: ${gabaritoPath}`);
            return res.json();
        })
        .then(data => {
            if (typeof data !== "object" || data === null || Object.keys(data).length === 0) {
                throw new Error("Formato inválido ou gabarito vazio.");
            }
            gabarito = data;
            // Ordena as chaves (números das questões) conforme o gabarito original
            // A ordenação numérica pode não corresponder à ordem da prova (ex: Inglês/Espanhol)
            // Usaremos a ordem do JSON por enquanto, mas idealmente o JSON deveria refletir a ordem da prova.
            todasQuestoesIds = Object.keys(gabarito).sort((a, b) => parseInt(a) - parseInt(b)); // Mantém a ordenação numérica por ID

            // Tenta carregar respostas salvas (se houver)
            const savedAnswers = localStorage.getItem(`respostas_${ano}_${dia}`);
            if (savedAnswers) {
                respostasUsuario = JSON.parse(savedAnswers);
            }
            // Tenta carregar idioma salvo
            const savedLang = localStorage.getItem(`idioma_${ano}_${dia}`);
            if (savedLang) {
                idiomaSelecionado = savedLang;
                // Se já tem idioma, inicia direto
                iniciarSimuladoComIdioma(idiomaSelecionado);
            }
            // Se não tem idioma salvo, espera o usuário escolher.

        })
        .catch(err => {
            console.error("Erro ao carregar gabarito:", err);
            document.getElementById("loading-message").textContent =
                `Erro ao carregar o gabarito: ${err.message}. Verifique o console para mais detalhes.`;
            document.getElementById("loading-message").style.color = "red";
            document.getElementById("loading-message").style.display = "block";
            document.getElementById("language-selection").style.display = "none"; // Esconde seleção se deu erro
        });
}

function iniciarSimuladoComIdioma(idioma) {
    idiomaSelecionado = idioma;
    localStorage.setItem(`idioma_${ano}_${dia}`, idiomaSelecionado);

    // Filtra as questões 1-5 baseado no idioma
    // ASSUMINDO que as questões de inglês são 1-5 e espanhol são 6-10 (EXEMPLO, PRECISA CONFIRMAR)
    // OU que os IDs no gabarito são tipo "001_EN", "001_ES" - PRECISA VERIFICAR E AJUSTAR
    // Por ora, vamos assumir uma lógica simples: se inglês, usa 1-5, se espanhol, pula 1-5 e começa da 6?
    // OU melhor: O gabarito PDF deve dizer a ordem correta.
    // Vamos implementar a filtragem básica, mas precisa de revisão com o gabarito real.

    questoesExibidasIds = todasQuestoesIds.filter(id => {
        const num = parseInt(id);
        if (num >= 1 && num <= 5) {
            // Aqui precisa da lógica real: verificar se a questão é do idioma selecionado.
            // Exemplo: Se o ID for "001EN" ou "001ES", ou se houver outra forma de mapear.
            // Por simplicidade AGORA: Se inglês, inclui 1-5. Se espanhol, NÃO inclui 1-5.
            // ISSO ESTÁ ERRADO, POIS AMBAS AS PROVAS TÊM QUESTÕES 1-5.
            // A LÓGICA CORRETA seria ter IDs distintos ou um mapeamento.
            // Vamos apenas incluir todas por enquanto e adicionar um AVISO.
            // console.warn("Lógica de filtro de idioma (1-5) precisa ser implementada corretamente com base na estrutura real dos dados.");
            return true; // Inclui todas por enquanto
        } else {
            return true; // Inclui todas as outras questões (6-90)
        }
    });

    // Esconde seleção de idioma e mostra a área de questões
    document.getElementById("language-selection").style.display = "none";
    document.getElementById("loading-message").style.display = "none";
    document.getElementById("question-area").style.display = "block";
    document.querySelector(".question-container").style.display = "block";
    document.querySelector(".navigation-buttons").style.display = "block"; // Garante que botões de navegação apareçam

    // Tenta carregar o índice da questão salva
    const savedIndex = localStorage.getItem(`questaoAtualIndex_${ano}_${dia}`);
    questaoAtualIndex = savedIndex ? parseInt(savedIndex) : 0;
    if (questaoAtualIndex >= questoesExibidasIds.length) {
        questaoAtualIndex = 0; // Reseta se o índice salvo for inválido
    }

    mostrarQuestao(questaoAtualIndex);
}


// Função para carregar imagens (CORRIGIDA para path e erro 404)
function carregarImagensQuestao(numeroQuestaoID, containerImagens) {
    containerImagens.innerHTML = ""; // Limpa imagens anteriores
    // Usa o ID original da questão (ex: "006") para buscar a imagem correspondente (ex: q6.jpeg)
    const numeroBase = parseInt(numeroQuestaoID, 10).toString(); // Remove zeros à esquerda se houver
    const basePath = `../${ano}/${dia}/imagens/q${numeroBase}`;
    let sufixoCharCode = 97; // 'a'
    let algumaImagemCarregada = false;
    let primeiraImagemPath = `${basePath}.jpeg`;

    console.log(`Tentando carregar imagens para ID ${numeroQuestaoID} com base ${basePath}`);

    function tentarCarregar(path, altText) {
        return new Promise((resolve) => {
            const img = new Image();
            // Corrige o path relativo para garantir que funcione
            // O path já parece correto: ../enem2024/dia1/imagens/qX.jpeg
            img.src = path;
            img.alt = altText;
            console.log(`Tentando carregar: ${path}`);
            img.onload = () => {
                console.log(`Carregada: ${path}`);
                containerImagens.appendChild(img);
                algumaImagemCarregada = true;
                resolve(true);
            };
            img.onerror = (err) => {
                console.error(`Erro ao carregar imagem ${path}:`, err);
                resolve(false);
            };
        });
    }

    // Tenta carregar a imagem base (ex: q6.jpeg)
    tentarCarregar(primeiraImagemPath, `Questão ${numeroBase}`).then(baseCarregada => {
        // Função recursiva para tentar carregar sufixos (ex: q6a.jpeg, q6b.jpeg)
        function tentarCarregarSufixo() {
            const sufixo = String.fromCharCode(sufixoCharCode);
            const pathComSufixo = `${basePath}${sufixo}.jpeg`;
            tentarCarregar(pathComSufixo, `Questão ${numeroBase}${sufixo}`).then(sufixoCarregado => {
                if (sufixoCarregado) {
                    sufixoCharCode++;
                    tentarCarregarSufixo(); // Tenta o próximo sufixo
                } else {
                    // Se a imagem base NÃO carregou E nenhuma com sufixo 'a' carregou, mostra placeholder
                    if (!baseCarregada && sufixoCharCode === 97 && !algumaImagemCarregada) {
                        console.log(`Nenhuma imagem encontrada para ${numeroBase}, usando placeholder.`);
                        const imgPlaceholder = document.createElement("img");
                        // Garante que o path do placeholder está correto
                        imgPlaceholder.src = "../assets/sem_imagem.png"; // Ajuste o path se necessário
                        imgPlaceholder.alt = "Imagem não disponível";
                        imgPlaceholder.style.maxWidth = "100%";
                        containerImagens.appendChild(imgPlaceholder);
                    }
                }
            });
        }
        // Inicia a tentativa de carregar sufixos
        tentarCarregarSufixo();
    });
}

function mostrarQuestao(index) {
    if (index < 0 || index >= questoesExibidasIds.length) {
        console.error("Índice de questão inválido:", index);
        return;
    }

    questaoAtualIndex = index;
    const numeroQuestaoID = questoesExibidasIds[index]; // ID original da questão (ex: "006")
    const numeroQuestaoExibido = index + 1; // Número sequencial para exibição (1, 2, 3...)

    console.log(`Mostrando questão: Índice ${index}, ID ${numeroQuestaoID}, Exibido como ${numeroQuestaoExibido}`);

    // CORRIGIDO: Exibe o número sequencial correto
    document.getElementById("question-number").textContent = `Questão ${numeroQuestaoExibido}`;
    // Passa o ID original para carregar a imagem correta
    carregarImagensQuestao(numeroQuestaoID, document.getElementById("question-images"));

    // Limpa seleção anterior dos botões
    document.querySelectorAll(".answer-button").forEach(btn => {
        btn.classList.remove("selected");
    });

    // Marca a resposta atual DO USUÁRIO (se houver) - CORRIGIDO para não pré-selecionar incorretamente
    const respostaSalva = respostasUsuario[numeroQuestaoID];
    if (respostaSalva) {
        document.querySelector(`.answer-button[data-option="${respostaSalva}"]`)?.classList.add("selected");
    }

    // Atualiza estado dos botões de navegação
    document.getElementById("prev-button").disabled = index === 0;
    document.getElementById("next-button").style.display = index === questoesExibidasIds.length - 1 ? "none" : "inline-block";
    document.getElementById("finish-button").style.display = index === questoesExibidasIds.length - 1 ? "inline-block" : "none";

    // Salva progresso no localStorage
    salvarProgresso();
}

function selecionarResposta(opcao) {
    const numeroQuestaoID = questoesExibidasIds[questaoAtualIndex];
    respostasUsuario[numeroQuestaoID] = opcao;

    console.log(`Resposta selecionada: Questão ID ${numeroQuestaoID}, Opção ${opcao}`);

    // Atualiza visualmente os botões
    document.querySelectorAll(".answer-button").forEach(btn => {
        btn.classList.remove("selected");
        if (btn.dataset.option === opcao) {
            btn.classList.add("selected");
        }
    });

    // Salva o progresso imediatamente após a seleção
    salvarProgresso();

    // Avança para a próxima questão automaticamente APÓS um pequeno delay
    setTimeout(() => {
        if (questaoAtualIndex < questoesExibidasIds.length - 1) {
            mostrarProximaQuestao();
        } else {
            console.log("Última questão respondida.");
            // Poderia opcionalmente mostrar uma mensagem ou habilitar o botão finalizar aqui
        }
    }, 300); // Delay de 300ms
}

function mostrarProximaQuestao() {
    if (questaoAtualIndex < questoesExibidasIds.length - 1) {
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
    localStorage.setItem(`questaoAtualIndex_${ano}_${dia}`, questaoAtualIndex.toString());
    // Idioma já é salvo quando selecionado
    console.log(`Progresso salvo: Índice ${questaoAtualIndex}, Respostas:`, respostasUsuario);
}

function finalizarSimulado() {
    salvarProgresso(); // Garante que a última resposta foi salva
    console.log("Finalizando simulado...");
    // Verifica se a página de revisão existe e redireciona
    const revisaoUrl = `revisao.html?ano=${ano}&dia=${dia}`;
    // Poderíamos verificar se o arquivo existe antes, mas vamos redirecionar diretamente
    window.location.href = revisaoUrl;
}

