let questions = [];
let correctAnswers = [];
let userAnswers = [];
let currentQuestion = 0;
let timer;
let timeLeft = 180;
let currentFolder = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const ano = params.get("ano");
  if (ano) {
    iniciarSimulado(ano);
  }
});

function iniciarSimulado(pasta) {
  currentFolder = pasta;
  document.getElementById("hub")?.style.display = "none";
  document.getElementById("quiz").style.display = "block";
  document.getElementById("voltarBtn").style.display = "block";

  fetch(`${pasta}/gabarito.json`)
    .then(res => res.json())
    .then(data => {
      correctAnswers = data;
      carregarQuestoesCompostas(data.length);
    })
    .catch(() => alert("Erro ao carregar gabarito."));
}

function carregarQuestoesCompostas(totalQuestoes) {
  const container = document.getElementById("questoesContainer");
  for (let i = 1; i <= totalQuestoes; i++) {
    const div = document.createElement("div");
    div.className = "questao";

    const titulo = document.createElement("h3");
    titulo.textContent = `Questão ${i.toString().padStart(3, '0')}`;
    div.appendChild(titulo);

    let sufixoIndex = 0;
    let imagensEncontradas = false;

    function tentarCarregarImagem() {
      const sufixo = sufixoIndex === 0 ? "" : String.fromCharCode(96 + sufixoIndex); // '', 'a', 'b', ...
      const imgPath = `${currentFolder}/imagens/q${i}${sufixo}.jpeg`;
      const img = document.createElement("img");
      img.src = imgPath;
      img.alt = `Questão ${i}${sufixo}`;
      img.onload = () => {
        imagensEncontradas = true;
        div.appendChild(img);
        sufixoIndex++;
        if (sufixoIndex <= 10) tentarCarregarImagem(); // tenta a próxima
      };
      img.onerror = () => {
        if (!imagensEncontradas && sufixoIndex === 0) {
          const aviso = document.createElement("p");
          aviso.textContent = `[Imagem não encontrada: ${imgPath}]`;
          aviso.style.color = "red";
          div.appendChild(aviso);
        }
      };
    }

    tentarCarregarImagem();

    const select = document.createElement("select");
    ["--", "A", "B", "C", "D", "E"].forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });
    select.onchange = () => {
      userAnswers[i - 1] = select.value;
    };

    const label = document.createElement("label");
    label.textContent = "Resposta: ";
    label.appendChild(select);
    div.appendChild(label);

    container.appendChild(div);
  }
}
