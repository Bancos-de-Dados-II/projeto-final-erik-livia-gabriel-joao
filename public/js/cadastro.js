"use strict";

const formularioCadastro = document.querySelector(
    "#form-cadastro-usuario"
);

const campoNome = document.querySelector("#nome");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");

const botaoCadastrar = document.querySelector(
    "#botao-cadastrar"
);

const mensagemCadastro = document.querySelector(
    "#mensagem-cadastro"
);

function mostrarMensagem(mensagem, tipo) {
    mensagemCadastro.textContent = mensagem;

    mensagemCadastro.classList.remove(
        "mensagem-login--erro",
        "mensagem-login--sucesso"
    );

    mensagemCadastro.classList.add(
        tipo === "sucesso"
            ? "mensagem-login--sucesso"
            : "mensagem-login--erro"
    );
}

async function cadastrarUsuario(evento) {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const email = campoEmail.value
        .trim()
        .toLowerCase();

    const senha = campoSenha.value;

    mensagemCadastro.classList.remove(
        "mensagem-login--erro",
        "mensagem-login--sucesso"
    );

    botaoCadastrar.disabled = true;
    botaoCadastrar.textContent = "Cadastrando...";

    try {
        const resposta = await fetch(
            "/api/auth/cadastro",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nome,
                    email,
                    senha
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                "Não foi possível criar a conta."
            );
        }

        mostrarMensagem(
            resultado.msg ||
            "Usuário cadastrado com sucesso!",
            "sucesso"
        );

        formularioCadastro.reset();

        setTimeout(() => {
            window.location.href = "./login.html";
        }, 1000);
    } catch (erro) {
        console.error(
            "Erro ao cadastrar usuário:",
            erro
        );

        mostrarMensagem(
            erro.message,
            "erro"
        );
    } finally {
        botaoCadastrar.disabled = false;
        botaoCadastrar.textContent = "Criar conta";
    }
}

formularioCadastro.addEventListener(
    "submit",
    cadastrarUsuario
);