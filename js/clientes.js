function abrirTelaPasta(nomeDaPasta) {
    document.getElementById('dashboard-screen').style.display = 'none';
    ['nova-pasta-screen', 'editar-pasta-screen', 'novo-cliente-screen', 'editar-cliente-screen', 'config-screen', 'auditoria-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('titulo-pasta').innerText = nomeDaPasta;
    
    const obsEl = document.getElementById('obs-pasta-atual');
    db.collection("pastas").doc(nomeDaPasta).get().then(doc => {
        if (doc.exists && doc.data().obs) {
            obsEl.innerHTML = `⚠️ OBSERVAÇÃO DA PASTA: ${doc.data().obs}`;
            obsEl.style.display = 'block';
        } else {
            obsEl.style.display = 'none';
        }
    });

    const campoBusca = document.getElementById('busca-cliente-pasta');
    if (campoBusca) campoBusca.value = '';

    const selectOrdenacao = document.getElementById('ordenacao-clientes');
    if (selectOrdenacao) selectOrdenacao.value = 'cadastro';

    filtrarClientesDaPasta();
}

function filtrarClientesDaPasta() {
    const campoBusca = document.getElementById('busca-cliente-pasta');
    const termo = campoBusca ? campoBusca.value.toLowerCase() : '';
    const nomeDaPasta = document.getElementById('titulo-pasta').innerText;
    const divLista = document.getElementById('lista-clientes');
    const ordenacao = document.getElementById('ordenacao-clientes') ? document.getElementById('ordenacao-clientes').value : 'cadastro';
    
    let clientesFiltrados = memoriaDoSistema.clientes.filter(c => 
        c.pasta === nomeDaPasta && 
        (c.nome.toLowerCase().includes(termo) || 
         c.cpf.includes(termo) || 
         (c.processo && c.processo.toLowerCase().includes(termo)))
    );

    if (ordenacao === 'alfabetica') {
        clientesFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
    } else {
        clientesFiltrados.sort((a, b) => {
            const timeA = (a.dataCriacao && typeof a.dataCriacao.toDate === 'function') ? a.dataCriacao.toDate().getTime() : Date.now();
            const timeB = (b.dataCriacao && typeof b.dataCriacao.toDate === 'function') ? b.dataCriacao.toDate().getTime() : Date.now();
            return timeA - timeB; 
        });
    }
    
    renderizarListaClientesHtml(clientesFiltrados, divLista);
}

function renderizarListaClientesHtml(clientes, divLista) {
    if (!divLista) return;

    if (clientes.length === 0) {
        divLista.innerHTML = '<p style="text-align: center; color: #86868b; margin: 20px 0;">Nenhum documento encontrado nesta pasta.</p>';
        return;
    }
    
    let html = '';
    clientes.forEach(cliente => {
        const btnExcluir = (usuarioLogado && (usuarioLogado.permAdmin || usuarioLogado.permExcluirCliente)) 
            ? `<button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: var(--danger-bg); color: var(--danger); border-radius: 8px;" onclick="excluirCliente('${cliente.idFirebase}', '${cliente.nome}')">🗑️</button>`
            : ``;

        const dataFormatada = cliente.data ? cliente.data.split('-').reverse().join('/') : 'N/I';
        const processoTexto = cliente.processo ? cliente.processo : 'N/I';
        const obsHtml = cliente.obs ? `<div class="info-detalhe" style="color: var(--danger); font-weight: 600; margin-top: 4px;">⚠️ OBS: ${cliente.obs}</div>` : '';

        html += `
        <div class="card-item">
            <div>
                <div style="font-weight: 600; color: #1d1d1f;">${cliente.nome}</div>
                <div class="info-detalhe">CPF: ${cliente.cpf}</div>
                <div class="info-detalhe">Processo: <b>${processoTexto}</b> | Data: <b>${dataFormatada}</b></div>
                ${obsHtml}
            </div>
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: #e5e7eb; border-radius: 8px; color: #1d1d1f; box-shadow: none;" onclick="abrirEditarCliente('${cliente.idFirebase}')">✏️</button>
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
        const obsHtml = c.obs ? `<div class="info-detalhe" style="color: var(--danger); font-weight: 600; margin-top: 4px;">⚠️ OBS: ${c.obs}</div>` : '';
        
        html += `
        <div class="card-item" style="flex-direction: column; align-items: flex-start;">
            <div style="font-weight: 600; color: #1d1d1f;">${c.nome}</div>
            <div class="info-detalhe">CPF: ${c.cpf} | Processo: ${c.processo || 'N/I'}</div>
            <div class="info-detalhe">Data Cad.: ${dataFormatada}</div>
            ${obsHtml}
            <div style="color: var(--primary); font-size: 13px; margin-top: 8px; font-weight: bold; cursor: pointer; text-decoration: underline;" onclick="abrirTelaPasta('${c.pasta}')">
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
    document.getElementById('nc-obs').value = '';
    document.getElementById('nc-data').value = new Date().toISOString().split('T')[0];
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
    const obs = document.getElementById('nc-obs').value.trim();
    const pastaAtual = document.getElementById('titulo-pasta').innerText;

    if (!nome || !cpf) return alert("Preencha Nome e CPF!");

    db.collection("clientes").add({
        nome: nome,
        cpf: cpf,
        processo: processo,
        data: data,
        obs: obs,
        pasta: pastaAtual,
        status: "ATIVO",
        criadoPor: usuarioLogado ? usuarioLogado.login : 'sistema',
        dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
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
    document.getElementById('ec-obs').value = cliente.obs || '';
}

function salvarEdicaoCliente() {
    const idFirebase = document.getElementById('ec-id-firebase').value;
    const nome = document.getElementById('ec-nome').value.trim();
    const cpf = document.getElementById('ec-cpf').value.trim();
    const processo = document.getElementById('ec-processo').value.trim();
    const data = document.getElementById('ec-data').value;
    const obs = document.getElementById('ec-obs').value.trim();

    if (!nome || !cpf) return alert("Preencha Nome e CPF!");

    db.collection("clientes").doc(idFirebase).update({
        nome: nome,
        cpf: cpf,
        processo: processo,
        data: data,
        obs: obs,
        atualizadoPor: usuarioLogado ? usuarioLogado.login : 'sistema',
        dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => voltarParaPastaDeCliente());
}

function excluirCliente(idFirebase, nome) {
    if (confirm(`Excluir o documento do(a) ${nome}?`)) {
        db.collection("clientes").doc(idFirebase).update({ 
            status: "EXCLUÍDO", 
            excluidoPor: usuarioLogado ? usuarioLogado.login : 'sistema',
            dataExclusao: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

function exportarRelatorioCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "TIPO;ID_OU_NOME;CPF;PROCESSO;LOCALIZACAO;CRIADO_POR;OBSERVACAO\n";

    db.collection("pastas").where("status", "==", "ATIVO").get().then(snapPastas => {
        snapPastas.forEach(doc => {
            const p = doc.data();
            const obsTexto = p.obs ? p.obs.replace(/;/g, ',') : '-';
            csvContent += `PASTA;${doc.id};-;-;${p.endereco} Sala ${p.andar} Caixa ${p.caixa};${p.criadoPor || 'sistema'};${obsTexto}\n`;
        });
        
        db.collection("clientes").where("status", "==", "ATIVO").get().then(snapClientes => {
            snapClientes.forEach(doc => {
                const c = doc.data();
                const obsTexto = c.obs ? c.obs.replace(/;/g, ',') : '-';
                csvContent += `CLIENTE;${c.nome};${c.cpf};${c.processo || '-'};${c.pasta};${c.criadoPor || 'sistema'};${obsTexto}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Relatorio_Arquivo_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    });
}