function abrirConfiguracoes() {
    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('config-screen').style.display = 'block';
    resetarFormularioUsuario();
    carregarListaUsuarios();
}

function alternarPermissoesAdmin() {
    const isAdmin = document.getElementById('perm-admin').checked;
    document.getElementById('perm-excluir-pasta').checked = isAdmin;
    document.getElementById('perm-excluir-cliente').checked = isAdmin;
    document.getElementById('perm-excluir-pasta').disabled = isAdmin;
    document.getElementById('perm-excluir-cliente').disabled = isAdmin;
}

function resetarFormularioUsuario() {
    document.getElementById('form-user-title').innerText = "Novo Usuário";
    document.getElementById('nu-login-antigo').value = "";
    document.getElementById('nu-nome').value = "";
    document.getElementById('nu-login').value = "";
    document.getElementById('nu-senha').value = "";
    document.getElementById('perm-admin').checked = false;
    document.getElementById('perm-excluir-pasta').checked = false;
    document.getElementById('perm-excluir-cliente').checked = false;
    alternarPermissoesAdmin();
    
    document.getElementById('btn-salvar-user').innerText = "Cadastrar Usuário";
    document.getElementById('btn-cancelar-user').style.display = "none";
}

function salvarUsuario() {
    const loginAntigo = document.getElementById('nu-login-antigo').value;
    const nome = document.getElementById('nu-nome').value.trim();
    const loginNovo = document.getElementById('nu-login').value.trim().toLowerCase();
    const senha = document.getElementById('nu-senha').value.trim();
    
    const pAdmin = document.getElementById('perm-admin').checked;
    const pExcluirPasta = document.getElementById('perm-excluir-pasta').checked;
    const pExcluirCliente = document.getElementById('perm-excluir-cliente').checked;

    if (!nome || !loginNovo || !senha) return alert("Preencha todos os campos!");

    const dadosUsuario = {
        nome: nome,
        senha: senha,
        permAdmin: pAdmin,
        permExcluirPasta: pExcluirPasta,
        permExcluirCliente: pExcluirCliente,
        atualizadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    };

    if (loginAntigo && loginAntigo !== loginNovo) {
        db.collection("usuarios").doc(loginNovo).set(dadosUsuario).then(() => {
            db.collection("usuarios").doc(loginAntigo).delete().then(() => {
                alert(`Usuário alterado para ${loginNovo}!`);
                resetarFormularioUsuario();
                carregarListaUsuarios();
            });
        });
    } else {
        db.collection("usuarios").doc(loginNovo).set(dadosUsuario).then(() => {
            alert(`Usuário ${loginNovo} salvo!`);
            resetarFormularioUsuario();
            carregarListaUsuarios();
        });
    }
}

function iniciarEdicaoUsuario(loginStr, dadosObjetoString) {
    const dados = JSON.parse(decodeURIComponent(dadosObjetoString));
    
    document.getElementById('form-user-title').innerText = `Editando Usuário: ${loginStr}`;
    document.getElementById('nu-login-antigo').value = loginStr;
    document.getElementById('nu-nome').value = dados.nome;
    document.getElementById('nu-login').value = loginStr;
    document.getElementById('nu-senha').value = dados.senha;
    
    document.getElementById('perm-admin').checked = dados.permAdmin || false;
    document.getElementById('perm-excluir-pasta').checked = dados.permExcluirPasta || false;
    document.getElementById('perm-excluir-cliente').checked = dados.permExcluirCliente || false;
    
    alternarPermissoesAdmin();

    document.getElementById('btn-salvar-user').innerText = "Salvar Alterações";
    document.getElementById('btn-cancelar-user').style.display = "block";
    window.scrollTo(0, 0);
}

function carregarListaUsuarios() {
    db.collection("usuarios").get().then(snapshot => {
        let html = '<h3 style="margin-top: 25px; font-size: 15px; text-align: left;">Usuários Cadastrados</h3>';
        snapshot.forEach(doc => {
            const u = doc.data();
            const tagAdmin = u.permAdmin ? '<span style="color: var(--apple-blue); font-size: 12px; font-weight: bold;">(ADMIN)</span>' : '';
            const dadosCodificados = encodeURIComponent(JSON.stringify(u));
            
            html += `
            <div class="card-item">
                <div>
                    <b>${u.nome}</b> ${tagAdmin}<br>
                    <small style="color: #86868b;">Login: ${doc.id}</small>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: #e5e5ea; border-radius: 8px; color: #1d1d1f;" onclick="iniciarEdicaoUsuario('${doc.id}', '${dadosCodificados}')">✏️</button>
                    ${doc.id !== 'denis' ? `<button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: var(--apple-red-bg); color: var(--apple-red); border-radius: 8px;" onclick="excluirUsuario('${doc.id}')">🗑️</button>` : ''}
                </div>
            </div>`;
        });
        document.getElementById('lista-usuarios').innerHTML = html;
    });
}

function excluirUsuario(login) {
    if (confirm(`Remover o usuário ${login}?`)) {
        db.collection("usuarios").doc(login).delete().then(() => carregarListaUsuarios());
    }
}