"use strict";

const usuarioSalvo = localStorage.getItem("usuario");

if (!usuarioSalvo) {
  window.location.href = "./login.html";
}

let usuarioLogado = null;

try {
  usuarioLogado = JSON.parse(usuarioSalvo);
} catch (erro) {
  localStorage.removeItem("usuario");
  window.location.href = "./login.html";
}

const nomeUsuario = document.querySelector("#nome-usuario");
const botaoSair = document.querySelector("#botao-sair");

if (nomeUsuario && usuarioLogado) {
  nomeUsuario.textContent = `Olá, ${usuarioLogado.nome}`;
}

if (botaoSair) {
  botaoSair.addEventListener("click", () => {
    localStorage.removeItem("usuario");
    window.location.href = "./login.html";
  });
}

/**
 * Pontos recebidos da API.
 */
let pontosDeColeta = [];

const coordenadasSousa = {
  latitude: -6.7592,
  longitude: -38.2281,
  zoom: 14,
};

const statusApi = document.querySelector("#status-api");

const quantidadePontos = document.querySelector("#quantidade-pontos");

const formulario = document.querySelector("#form-cadastro");

const campoNome = document.querySelector("#nome");
const campoMaterial = document.querySelector("#material");
const campoEndereco = document.querySelector("#endereco");
const campoHorario = document.querySelector("#horario");

const campoLatitude = document.querySelector("#latitude");
const campoLongitude = document.querySelector("#longitude");

const botaoCadastrar = formulario.querySelector('button[type="submit"]');

const modalAvaliacoes = document.querySelector("#modal-avaliacoes");

const fecharModalAvaliacoes = document.querySelector(
  "#fechar-modal-avaliacoes",
);

const tituloModalAvaliacoes = document.querySelector(
  "#titulo-modal-avaliacoes",
);

const formularioAvaliacao = document.querySelector("#form-avaliacao");

const campoNotaAvaliacao = document.querySelector("#nota-avaliacao");

const campoComentarioAvaliacao = document.querySelector(
  "#comentario-avaliacao",
);

const avaliacoesContainer = document.querySelector("#avaliacoes-container");

const mensagemAvaliacoes = document.querySelector("#mensagem-avaliacoes");

let pontoSelecionadoParaAvaliacao = null;

let avaliacaoEmEdicaoId = null;

/**
 * Cria o mapa e centraliza na cidade de Sousa.
 */
const mapa = L.map("mapa").setView(
  [coordenadasSousa.latitude, coordenadasSousa.longitude],
  coordenadasSousa.zoom,
);

let marcadorSelecao = null;

let pontoEmEdicaoId = null;

const marcadoresPontos = L.layerGroup().addTo(mapa);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(mapa);

/**
 * Atualiza as informações visuais da API.
 *
 * @param {string} fonte Fonte dos dados retornada pelo backend.
 * @param {number} quantidade Quantidade de pontos carregados.
 */
function atualizarInformacoesApi(fonte, quantidade) {
  statusApi.classList.remove("status--carregando", "status--erro");

  statusApi.textContent = `Dados: ${fonte}`;

  quantidadePontos.textContent =
    quantidade === 1 ? "1 ponto" : `${quantidade} pontos`;
}

/**
 * Mostra uma falha ao buscar os pontos.
 */
function mostrarErroApi() {
  statusApi.classList.remove("status--carregando");
  statusApi.classList.add("status--erro");

  statusApi.textContent = "Erro ao carregar";
  quantidadePontos.textContent = "0 pontos";
}

/**
 * Remove os marcadores dos pontos cadastrados.
 */
function limparMarcadores() {
  marcadoresPontos.clearLayers();
}

/**
 * Exibe os pontos carregados no mapa.
 */
function exibirPontosNoMapa() {
  limparMarcadores();

  if (pontosDeColeta.length === 0) {
    return;
  }

  const limites = [];

  pontosDeColeta.forEach((ponto) => {
    if (!ponto.localizacao || !Array.isArray(ponto.localizacao.coordinates)) {
      return;
    }

    const [longitude, latitude] = ponto.localizacao.coordinates;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return;
    }

    const marcador = L.marker([latitude, longitude]).addTo(marcadoresPontos);

    marcador.bindPopup(`
    <strong>${ponto.nome}</strong><br>
    <b>Material:</b> ${ponto.material}<br>
    <b>Endereço:</b> ${ponto.endereco}<br>
    <b>Horário:</b> ${ponto.horario}<br><br>

    <button
        type="button"
        class="botao-editar-ponto"
        data-id="${ponto._id}"
    >
        Editar
    </button>

    <button
        type="button"
        class="botao-excluir-ponto"
        data-id="${ponto._id}"
    >
        Excluir
    </button>

    <button
    type="button"
    class="botao-avaliacoes-ponto"
    data-id="${ponto._id}"
    data-nome="${ponto.nome}"
>
    Avaliações
</button>
`);

    limites.push([latitude, longitude]);
  });

  if (limites.length === 1) {
    mapa.setView(limites[0], 16);
    return;
  }

  if (limites.length > 1) {
    mapa.fitBounds(limites, {
      padding: [40, 40],
    });
  }
}

/**
 * Verifica se todos os campos necessários foram preenchidos.
 */
function atualizarEstadoBotao() {
  const formularioValido =
    campoNome.value.trim() !== "" &&
    campoMaterial.value !== "" &&
    campoEndereco.value.trim() !== "" &&
    campoHorario.value.trim() !== "" &&
    campoLatitude.value !== "" &&
    campoLongitude.value !== "";

  botaoCadastrar.disabled = !formularioValido;
}

/**
 * Seleciona a localização do novo ponto no mapa.
 */
mapa.on("click", (evento) => {
  // Se já existe um ponto selecionado, não altera a localização.
  if (marcadorSelecao) {
    return;
  }

  const { lat, lng } = evento.latlng;

  campoLatitude.value = lat.toFixed(6);
  campoLongitude.value = lng.toFixed(6);

  marcadorSelecao = L.marker([lat, lng]).addTo(mapa);

  marcadorSelecao
    .bindPopup("Localização selecionada. Clique no marcador para remover.")
    .openPopup();

  marcadorSelecao.on("click", (eventoMarcador) => {
    // Impede que o clique no marcador também seja interpretado
    // como um clique no mapa.
    L.DomEvent.stopPropagation(eventoMarcador.originalEvent);

    mapa.removeLayer(marcadorSelecao);
    marcadorSelecao = null;

    campoLatitude.value = "";
    campoLongitude.value = "";

    atualizarEstadoBotao();
  });

  atualizarEstadoBotao();
});

/**
 * Atualiza o estado do botão quando os campos mudarem.
 */
[campoNome, campoMaterial, campoEndereco, campoHorario].forEach((campo) => {
  campo.addEventListener("input", atualizarEstadoBotao);

  campo.addEventListener("change", atualizarEstadoBotao);
});

/**
 * Busca os pontos cadastrados no backend.
 */
async function carregarPontos() {
  statusApi.classList.remove("status--erro");
  statusApi.classList.add("status--carregando");

  statusApi.textContent = "Carregando pontos...";

  try {
    const resposta = await fetch("/api/pontos");

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const resultado = await resposta.json();

    pontosDeColeta = Array.isArray(resultado.dados) ? resultado.dados : [];

    atualizarInformacoesApi(
      resultado.fonte || "Não informada",
      pontosDeColeta.length,
    );

    console.log("Pontos de coleta carregados:", pontosDeColeta);

    console.table(pontosDeColeta);

    exibirPontosNoMapa();
  } catch (erro) {
    pontosDeColeta = [];

    limparMarcadores();
    mostrarErroApi();

    console.error("Não foi possível carregar os pontos de coleta:", erro);
  }
}

/**
 * Preenche o formulário com os dados de um ponto.
 *
 * @param {object} ponto Ponto que será editado.
 */
function iniciarEdicaoPonto(ponto) {
  if (!ponto.localizacao || !Array.isArray(ponto.localizacao.coordinates)) {
    alert("Este ponto não possui uma localização válida.");
    return;
  }

  const [longitude, latitude] = ponto.localizacao.coordinates;

  pontoEmEdicaoId = ponto._id;

  campoNome.value = ponto.nome || "";
  campoMaterial.value = ponto.material || "";
  campoEndereco.value = ponto.endereco || "";
  campoHorario.value = ponto.horario || "";

  campoLatitude.value = latitude;
  campoLongitude.value = longitude;

  if (marcadorSelecao) {
    mapa.removeLayer(marcadorSelecao);
  }

  marcadorSelecao = L.marker([latitude, longitude]).addTo(mapa);

  marcadorSelecao.bindPopup("Localização do ponto em edição").openPopup();

  mapa.setView([latitude, longitude], 16);

  botaoCadastrar.textContent = "Salvar alterações";

  atualizarEstadoBotao();

  formulario.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/**
 * Cadastra um novo ponto de coleta.
 *
 * @param {SubmitEvent} evento Evento de envio do formulário.
 */
/**
 * Cadastra ou atualiza um ponto de coleta.
 *
 * @param {SubmitEvent} evento Evento de envio do formulário.
 */
async function cadastrarPonto(evento) {
  evento.preventDefault();

  atualizarEstadoBotao();

  if (botaoCadastrar.disabled) {
    return;
  }

  const editando = pontoEmEdicaoId !== null;

  const url = editando ? `/api/pontos/${pontoEmEdicaoId}` : "/api/pontos";

  const metodo = editando ? "PUT" : "POST";

  botaoCadastrar.disabled = true;

  botaoCadastrar.textContent = editando ? "Salvando..." : "Cadastrando...";

  try {
    const resposta = await fetch(url, {
      method: metodo,

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        nome: campoNome.value.trim(),
        material: campoMaterial.value,
        endereco: campoEndereco.value.trim(),
        horario: campoHorario.value.trim(),
        latitude: campoLatitude.value,
        longitude: campoLongitude.value,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.erro || "Não foi possível salvar o ponto.");
    }

    formulario.reset();

    campoLatitude.value = "";
    campoLongitude.value = "";

    if (marcadorSelecao) {
      mapa.removeLayer(marcadorSelecao);
      marcadorSelecao = null;
    }

    pontoEmEdicaoId = null;

    botaoCadastrar.textContent = "Cadastrar ponto";

    await carregarPontos();

    alert(
      editando
        ? "Ponto atualizado com sucesso!"
        : "Ponto cadastrado com sucesso!",
    );
  } catch (erro) {
    console.error("Erro ao salvar ponto:", erro);

    alert(erro.message);
  } finally {
    botaoCadastrar.textContent = pontoEmEdicaoId
      ? "Salvar alterações"
      : "Cadastrar ponto";

    atualizarEstadoBotao();
  }
}

function criarEstrelas(nota) {
  const quantidade = Number(nota);

  return "⭐".repeat(quantidade);
}

function abrirModalAvaliacoes(
  pontoId,
  nomePonto,
) {
  pontoSelecionadoParaAvaliacao = pontoId;
  avaliacaoEmEdicaoId = null;

  tituloModalAvaliacoes.textContent =
    `Avaliações de ${nomePonto}`;

  formularioAvaliacao.reset();

  const botaoEnviar =
    formularioAvaliacao.querySelector(
      'button[type="submit"]',
    );

  botaoEnviar.textContent =
    "Enviar avaliação";

  modalAvaliacoes.classList.remove(
    "modal-avaliacoes--oculto",
  );

  carregarAvaliacoes(pontoId);
}

function fecharModalDeAvaliacoes() {
  modalAvaliacoes.classList.add(
    "modal-avaliacoes--oculto",
  );

  pontoSelecionadoParaAvaliacao = null;
  avaliacaoEmEdicaoId = null;

  formularioAvaliacao.reset();

  const botaoEnviar =
    formularioAvaliacao.querySelector(
      'button[type="submit"]',
    );

  botaoEnviar.textContent =
    "Enviar avaliação";
}

function exibirAvaliacoes(avaliacoes) {
  avaliacoesContainer.innerHTML = "";

  if (avaliacoes.length === 0) {
    mensagemAvaliacoes.style.display = "block";
    mensagemAvaliacoes.textContent =
      "Este EcoPonto ainda não possui avaliações.";

    return;
  }

  mensagemAvaliacoes.style.display = "none";

  avaliacoes.forEach((avaliacao) => {
    const item = document.createElement("article");

    item.classList.add("avaliacao-item");

    const comentario =
      avaliacao.comentario || "Avaliação sem comentário.";

    item.innerHTML = `
      <div class="avaliacao-item__nota">
        ${criarEstrelas(avaliacao.nota)}
      </div>

      <p class="avaliacao-item__comentario"></p>

      <div class="avaliacao-item__acoes">
        <button
          type="button"
          class="botao-editar-avaliacao"
          data-id="${avaliacao._id}"
          data-nota="${avaliacao.nota}"
        >
          Editar
        </button>

        <button
          type="button"
          class="botao-excluir-avaliacao"
          data-id="${avaliacao._id}"
        >
          Excluir
        </button>
      </div>
    `;

    const elementoComentario = item.querySelector(
      ".avaliacao-item__comentario",
    );

    elementoComentario.textContent = comentario;

    const botaoEditar = item.querySelector(
      ".botao-editar-avaliacao",
    );

    botaoEditar.dataset.comentario =
      avaliacao.comentario || "";

    avaliacoesContainer.appendChild(item);
  });
}

function iniciarEdicaoAvaliacao(
  avaliacaoId,
  nota,
  comentario,
) {
  avaliacaoEmEdicaoId = avaliacaoId;

  campoNotaAvaliacao.value = nota;
  campoComentarioAvaliacao.value = comentario;

  const botaoEnviar =
    formularioAvaliacao.querySelector(
      'button[type="submit"]',
    );

  botaoEnviar.textContent = "Salvar alterações";

  formularioAvaliacao.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  campoComentarioAvaliacao.focus();
}

async function carregarAvaliacoes(pontoId) {
  mensagemAvaliacoes.style.display = "block";
  mensagemAvaliacoes.textContent = "Carregando avaliações...";

  avaliacoesContainer.innerHTML = "";

  try {
    const resposta = await fetch(`/api/pontos/${pontoId}/avaliacoes`);

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        resultado.erro || "Não foi possível carregar as avaliações.",
      );
    }

    const avaliacoes = Array.isArray(resultado) ? resultado : [];

    exibirAvaliacoes(avaliacoes);
  } catch (erro) {
    console.error("Erro ao carregar avaliações:", erro);

    mensagemAvaliacoes.style.display = "block";
    mensagemAvaliacoes.textContent = erro.message;
  }
}

async function cadastrarAvaliacao(evento) {
  evento.preventDefault();

  if (!pontoSelecionadoParaAvaliacao) {
    alert("Nenhum EcoPonto foi selecionado.");
    return;
  }

  const nota = Number(campoNotaAvaliacao.value);

  const comentario =
    campoComentarioAvaliacao.value.trim();

  if (!nota || nota < 1 || nota > 5) {
    alert("Selecione uma nota entre 1 e 5.");
    return;
  }

  const editando =
    avaliacaoEmEdicaoId !== null;

  const url = editando
    ? `/api/avaliacoes/${avaliacaoEmEdicaoId}`
    : `/api/pontos/${pontoSelecionadoParaAvaliacao}/avaliacoes`;

  const metodo = editando ? "PUT" : "POST";

  const botaoEnviar =
    formularioAvaliacao.querySelector(
      'button[type="submit"]',
    );

  botaoEnviar.disabled = true;

  botaoEnviar.textContent = editando
    ? "Salvando..."
    : "Enviando...";

  try {
    const resposta = await fetch(url, {
      method: metodo,

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        nota,
        comentario,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        resultado.erro ||
          "Não foi possível salvar a avaliação.",
      );
    }

    formularioAvaliacao.reset();

    avaliacaoEmEdicaoId = null;

    await carregarAvaliacoes(
      pontoSelecionadoParaAvaliacao,
    );

    alert(
      editando
        ? "Avaliação atualizada com sucesso!"
        : "Avaliação cadastrada com sucesso!",
    );
  } catch (erro) {
    console.error(
      "Erro ao salvar avaliação:",
      erro,
    );

    alert(erro.message);
  } finally {
    botaoEnviar.disabled = false;

    botaoEnviar.textContent =
      avaliacaoEmEdicaoId
        ? "Salvar alterações"
        : "Enviar avaliação";
  }
}
async function excluirAvaliacao(avaliacaoId) {
  const confirmar = confirm(
    "Deseja realmente excluir esta avaliação?",
  );

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(
      `/api/avaliacoes/${avaliacaoId}`,
      {
        method: "DELETE",
      },
    );

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        resultado.erro ||
          "Não foi possível excluir a avaliação.",
      );
    }

    if (avaliacaoEmEdicaoId === avaliacaoId) {
      avaliacaoEmEdicaoId = null;

      formularioAvaliacao.reset();

      const botaoEnviar =
        formularioAvaliacao.querySelector(
          'button[type="submit"]',
        );

      botaoEnviar.textContent =
        "Enviar avaliação";
    }

    await carregarAvaliacoes(
      pontoSelecionadoParaAvaliacao,
    );

    alert("Avaliação excluída com sucesso!");
  } catch (erro) {
    console.error(
      "Erro ao excluir avaliação:",
      erro,
    );

    alert(erro.message);
  }
}

/**
 * Identifica o botão de edição clicado no popup.
 */
document.addEventListener("click", (evento) => {

      const botaoEditarAvaliacao =
    evento.target.closest(
      ".botao-editar-avaliacao",
    );

  if (botaoEditarAvaliacao) {
    iniciarEdicaoAvaliacao(
      botaoEditarAvaliacao.dataset.id,
      botaoEditarAvaliacao.dataset.nota,
      botaoEditarAvaliacao.dataset.comentario,
    );

    return;
  }

  const botaoExcluirAvaliacao =
    evento.target.closest(
      ".botao-excluir-avaliacao",
    );

  if (botaoExcluirAvaliacao) {
    excluirAvaliacao(
      botaoExcluirAvaliacao.dataset.id,
    );

    return;
  }
  const botaoAvaliacoes = evento.target.closest(".botao-avaliacoes-ponto");

  if (botaoAvaliacoes) {
    abrirModalAvaliacoes(
      botaoAvaliacoes.dataset.id,
      botaoAvaliacoes.dataset.nome,
    );

    return;
  }
  const botaoEditar = evento.target.closest(".botao-editar-ponto");

  if (botaoEditar) {
    const pontoId = botaoEditar.dataset.id;

    const pontoSelecionado = pontosDeColeta.find(
      (ponto) => ponto._id === pontoId,
    );

    if (!pontoSelecionado) {
      alert("Ponto não encontrado.");
      return;
    }

    iniciarEdicaoPonto(pontoSelecionado);

    return;
  }

  const botaoExcluir = evento.target.closest(".botao-excluir-ponto");

  if (botaoExcluir) {
    excluirPonto(botaoExcluir.dataset.id);
  }
});

/**
 * Exclui um ponto de coleta.
 *
 * @param {string} id
 */
async function excluirPonto(id) {
  const confirmar = confirm("Deseja realmente excluir este ponto?");

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(`/api/pontos/${id}`, {
      method: "DELETE",
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.erro || "Erro ao excluir ponto.");
    }

    if (pontoEmEdicaoId === id) {
      formulario.reset();

      campoLatitude.value = "";
      campoLongitude.value = "";

      pontoEmEdicaoId = null;

      if (marcadorSelecao) {
        mapa.removeLayer(marcadorSelecao);
        marcadorSelecao = null;
      }

      botaoCadastrar.textContent = "Cadastrar ponto";

      atualizarEstadoBotao();
    }

    await carregarPontos();

    alert("Ponto excluído com sucesso!");
  } catch (erro) {
    console.error(erro);

    alert(erro.message);
  }
}
/**
 * Envia o formulário para a API.
 */
formulario.addEventListener("submit", cadastrarPonto);

formularioAvaliacao.addEventListener(
  "submit",
  cadastrarAvaliacao,
);

fecharModalAvaliacoes.addEventListener(
  "click",
  fecharModalDeAvaliacoes,
);

modalAvaliacoes.addEventListener(
  "click",
  (evento) => {
    if (evento.target === modalAvaliacoes) {
      fecharModalDeAvaliacoes();
    }
  },
);

document.addEventListener("keydown", (evento) => {
  if (
    evento.key === "Escape" &&
    !modalAvaliacoes.classList.contains(
      "modal-avaliacoes--oculto",
    )
  ) {
    fecharModalDeAvaliacoes();
  }
});

/**
 * Carrega os pontos quando a página estiver pronta.
 */
document.addEventListener("DOMContentLoaded", () => {
  atualizarEstadoBotao();
  carregarPontos();
});
