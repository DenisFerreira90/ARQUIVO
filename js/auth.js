function verificarEnterLogin(event) {
    if (event.key === "Enter") fazerLogin();
}

function fazerLogin() {
    const user = document.getElementById('login-user').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value.trim();
    const msgErro = document.getElementById('msg-login');
    const btnLogin = document.querySelector('#login-screen button');

    if (!user || !senha) {
        msgErro.innerText = "Preencha usuário e senha.";
        msgErro.style.display = 'block';
        return;
    }

    btnLogin.innerText = "Autenticando...";
    msgErro.style.display = 'none';

    db.collection("usuarios").doc(user).get().then(doc => {
        btnLogin.innerText = "Entrar";

        if (doc.exists && doc.data().senha === senha) {
            usuarioLogado = { login: user, ...doc.data() };
            
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('senha').value = '';
            
            const btnConfig = document.getElementById('btn-configuracoes');
            if (btnConfig) btnConfig.style.display = usuarioLogado.permAdmin ? 'block' : 'none';
            
            const btnAuditoria = document.getElementById('btn-auditoria');
            if (btnAuditoria) btnAuditoria.style.display = usuarioLogado.permAdmin ? 'block' : 'none';
            
            const btnExcluirP = document.getElementById('btn-excluir-pasta');
            if (btnExcluirP) btnExcluirP.style.display = (usuarioLogado.permAdmin || usuarioLogado.permExcluirPasta) ? 'block' : 'none';
            
            iniciarSistema();
        } else {
            msgErro.innerText = "Usuário ou senha incorretos.";
            msgErro.style.display = 'block';
        }
    }).catch(() => {
        btnLogin.innerText = "Entrar";
        msgErro.innerText = "Erro ao conectar com o banco de dados.";
        msgErro.style.display = 'block';
    });
}

function sair() {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('config-screen').style.display = 'none';
    document.getElementById('auditoria-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
    
    const buscaInput = document.getElementById('busca-global');
    if (buscaInput) {
        buscaInput.value = '';
        pesquisarGlobal(); 
    }
}