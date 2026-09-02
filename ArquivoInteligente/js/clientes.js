function abrirTelaPasta(nomeDaPasta) {
    document.getElementById('dashboard-screen').style.display = 'none';
    ['nova-pasta-screen', 'editar-pasta-screen', 'novo-cliente-screen', 'editar-cliente-screen', 'config-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('titulo-pasta').innerText = nomeDaPasta;
    
    const campoBusca = document.getElementById('busca-cliente-pasta');
    if (campoBusca) campoBusca.value = '';

    filtrarClientesDaPasta();
}

function filtrarClientesDaPasta() {
    const campoBusca = document.getElementById('busca-cliente-pasta');
    const termo = campoBusca ? campoBusca.value.toLowerCase() : '';
    const nomeDaPasta = document.getElementById('titulo-pasta').innerText;
    const divLista = document.getElementById('lista-clientes');
    
    const clientesFiltrados = memoriaDoSistema.clientes.filter(c => 
        c.pasta === nomeDaPasta && 
        (c.nome.toLowerCase().includes(termo) || 
         c.cpf.includes(termo) || 
         (c.processo && c.processo.toLowerCase().includes(termo)))
    );
    
    renderizarListaClientesHtml(clientesFiltrados, divLista);
}

function renderizarListaClientesHtml(clientes, divLista) {
    if (!divLista) return;

    if (clientes.length === 0) {
        divLista.innerHTML = '<p style="text-align: center; color: #86868b; margin: 20px 0;">Nenhum cliente encontrado.</p>';
        return;
    }
    
    let html = '';
    clientes.forEach(cliente => {
        const btnExcluir = (usuarioLogado && (usuarioLogado.permAdmin || usuarioLogado.permExcluirCliente)) 
            ? `<button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: var(--apple-red-bg); color: var(--apple-red); border-radius: 8px;" onclick="excluirCliente('${cliente.idFirebase}', '${cliente.nome}')">🗑️</button>`
            : ``;

        const dataFormatada = cliente.data ? cliente.data.split('-').reverse().join('/') : 'N/I';
        const processoTexto = cliente.processo ? cliente.processo : 'N/I';

        html += `
        <div class="card-item">
            <div>
                <div style="font-weight: 600; color: #1d1d1f;">${cliente.nome}</div>
                <div class="info-detalhe">CPF: ${cliente.cpf}</div>
                <div class="info-detalhe">Processo: <b>${processoTexto}</b> | Data: <b>${dataFormatada}</b></div>
            </div>
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: #e5e5ea; border-radius: 8px; color: #1d1d1f;" onclick="abrirEditarCliente('${cliente.idFirebase}')">✏️</button>
                ${btnExcluir}
            </div>
        </div>`;
    });
    divLista.innerHTML = html;
}

function pesquisarGlobal() {
    const termo = document.getElementById('busca-global').value.toLowerCase();
    const divResultados = document.getElementById('resultados-busca');
    const divPastas = document.getElementById('lista-pastas');

    if (termo.length < 2) {
        divResultados.style.display = 'none';
        divPastas.style.display = 'block';
        return;
    }

    divPastas.style.display = 'none';
    divResultados.style.display = 'block';

    const clientesFiltrados = memoriaDoSistema.clientes.filter(c => 
        c.nome.toLowerCase().includes(termo) || 
        c.cpf.includes(termo) || 
        (c.processo && c.processo.toLowerCase().includes(termo))
    );

    if (clientesFiltrados.length === 0) {
        divResultados.innerHTML = '<p style="text-align:center; color:#86868b;">Nenhum cliente encontrado.</p>';
        return;
    }

    let html = '<p style="font-size: 13px; color: #86868b; text-align: left; margin-bottom: 10px;">Resultados encontrados:</p>';
    clientesFiltrados.forEach(c => {
        const dataFormatada = c.data ? c.data.split('-').reverse().join('/') : 'N/I';
        html += `
        <div class="card-item" style="flex-direction: column; align-items: flex-start;">
            <div style="font-weight: 600; color: #1d1d1f;">${c.nome}</div>
            <div class="info-detalhe">CPF: ${c.cpf} | Processo: ${c.processo || 'N/I'}</div>
            <div class="info-detalhe">Data Cad.: ${dataFormatada}</div>
            <div style="color: var(--apple-blue); font-size: 13px; margin-top: 8px; font-weight: bold; cursor: pointer; text-decoration: underline;" onclick="abrirTelaPasta('${c.pasta}')">
                📍 Ir para a ${c.pasta}
            </div>
        </div>`;
    });
    divResultados.innerHTML = html;
}

function abrirCadastroCliente() {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('novo-cliente-screen').style.display = 'block';
    document.getElementById('nc-pasta-destino').innerText = `Destino: ${document.getElementById('titulo-pasta').innerText}`;
    document.getElementById('nc-nome').value = '';
    document.getElementById('nc-cpf').value = '';
    document.getElementById('nc-processo').value = '';
    document.getElementById('nc-data').value = new Date().toISOString().split('T')[0]; // Data atual padrão
}

function voltarParaPastaDeCliente() {
    document.getElementById('novo-cliente-screen').style.display = 'none';
    document.getElementById('editar-cliente-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
}

function salvarNovoCliente() {
    const nome = document.getElementById('nc-nome').value.trim();
    const cpf = document.getElementById('nc-cpf').value.trim();
    const processo = document.getElementById('nc-processo').value.trim();
    const data = document.getElementById('nc-data').value;
    const pastaAtual = document.getElementById('titulo-pasta').innerText;

    if (!nome || !cpf) return alert("Preencha Nome e CPF!");

    db.collection("clientes").add({
        nome: nome,
        cpf: cpf,
        processo: processo,
        data: data,
        pasta: pastaAtual,
        status: "ATIVO",
        criadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    }).then(() => voltarParaPastaDeCliente());
}

function abrirEditarCliente(idFirebase) {
    const cliente = memoriaDoSistema.clientes.find(c => c.idFirebase === idFirebase);
    if (!cliente) return;

    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('editar-cliente-screen').style.display = 'block';
    document.getElementById('ec-id-firebase').value = idFirebase;
    document.getElementById('ec-nome').value = cliente.nome || '';
    document.getElementById('ec-cpf').value = cliente.cpf || '';
    document.getElementById('ec-processo').value = cliente.processo || '';
    document.getElementById('ec-data').value = cliente.data || '';
}

function salvarEdicaoCliente() {
    const idFirebase = document.getElementById('ec-id-firebase').value;
    const nome = document.getElementById('ec-nome').value.trim();
    const cpf = document.getElementById('ec-cpf').value.trim();
    const processo = document.getElementById('ec-processo').value.trim();
    const data = document.getElementById('ec-data').value;

    if (!nome || !cpf) return alert("Preencha Nome e CPF!");

    db.collection("clientes").doc(idFirebase).update({
        nome: nome,
        cpf: cpf,
        processo: processo,
        data: data,
        atualizadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    }).then(() => voltarParaPastaDeCliente());
}

function excluirCliente(idFirebase, nome) {
    if (confirm(`Excluir o cliente ${nome}?`)) {
        db.collection("clientes").doc(idFirebase).update({ 
            status: "EXCLUÍDO", 
            excluidoPor: usuarioLogado ? usuarioLogado.login : 'sistema' 
        });
    }
}