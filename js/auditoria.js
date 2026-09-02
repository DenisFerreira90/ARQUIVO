function abrirAuditoria() {
    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('config-screen').style.display = 'none';
    document.getElementById('auditoria-screen').style.display = 'block';
    carregarAuditoria();
}

function voltarParaDashboardDeAuditoria() {
    document.getElementById('auditoria-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
}

function formatarData(timestamp) {
    if (!timestamp) return 'Data não registrada';
    return timestamp.toDate().toLocaleString('pt-BR');
}

function carregarAuditoria() {
    const divAuditoria = document.getElementById('lista-auditoria');
    divAuditoria.innerHTML = '<p style="text-align: center; color: #86868b;">Varrendo banco de dados e limpando registros antigos...</p>';

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    
    let html = '';

    db.collection("pastas").where("status", "==", "EXCLUÍDO").get().then(snapshot => {
        let pastasExcluidas = [];
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            const dataExclusaoDate = dados.dataExclusao ? dados.dataExclusao.toDate() : new Date(0);
            
            if (dataExclusaoDate < trintaDiasAtras && dados.dataExclusao) {
                db.collection("pastas").doc(doc.id).delete(); 
            } else {
                pastasExcluidas.push({ id: doc.id, dados: dados, time: dataExclusaoDate.getTime() });
            }
        });

        pastasExcluidas.sort((a, b) => b.time - a.time);

        html += '<h3 style="font-size: 15px; margin-top: 10px;">📁 Pastas Removidas (Últimos 30 dias)</h3>';
        if (pastasExcluidas.length === 0) html += '<p style="font-size: 13px; color: #86868b;">Nenhuma pasta na lixeira.</p>';

        pastasExcluidas.forEach(item => {
            html += `
            <div class="card-item" style="flex-direction: column; align-items: flex-start; border-left: 4px solid var(--danger);">
                <div style="font-weight: 600;">ID da Pasta: ${item.id}</div>
                <div class="info-detalhe">Excluído por: <b>${item.dados.excluidoPor || 'Desconhecido'}</b> em ${formatarData(item.dados.dataExclusao)}</div>
                <button style="margin-top: 12px; background-color: var(--success); padding: 8px; font-size: 13px; width: auto;" onclick="restaurarPasta('${item.id}')">🔄 Restaurar</button>
            </div>`;
        });

        db.collection("clientes").where("status", "==", "EXCLUÍDO").get().then(snapClientes => {
            let clientesExcluidos = [];
            
            snapClientes.forEach(doc => {
                const dados = doc.data();
                const dataExclusaoDate = dados.dataExclusao ? dados.dataExclusao.toDate() : new Date(0);
                
                if (dataExclusaoDate < trintaDiasAtras && dados.dataExclusao) {
                    db.collection("clientes").doc(doc.id).delete();
                } else {
                    clientesExcluidos.push({ id: doc.id, dados: dados, time: dataExclusaoDate.getTime() });
                }
            });

            clientesExcluidos.sort((a, b) => b.time - a.time);

            html += '<h3 style="font-size: 15px; margin-top: 25px;">📄 Clientes Removidos (Últimos 30 dias)</h3>';
            if (clientesExcluidos.length === 0) html += '<p style="font-size: 13px; color: #86868b;">Nenhum cliente na lixeira.</p>';

            clientesExcluidos.forEach(item => {
                html += `
                <div class="card-item" style="flex-direction: column; align-items: flex-start; border-left: 4px solid var(--danger);">
                    <div style="font-weight: 600;">${item.dados.nome} (CPF: ${item.dados.cpf})</div>
                    <div class="info-detalhe">Local original: ${item.dados.pasta}</div>
                    <div class="info-detalhe">Excluído por: <b>${item.dados.excluidoPor || 'Desconhecido'}</b> em ${formatarData(item.dados.dataExclusao)}</div>
                    <button style="margin-top: 12px; background-color: var(--success); padding: 8px; font-size: 13px; width: auto;" onclick="restaurarCliente('${item.id}')">🔄 Restaurar</button>
                </div>`;
            });

            divAuditoria.innerHTML = html;
        });
    });
}

function restaurarPasta(id) {
    if(confirm(`Restaurar a pasta ${id}?`)) {
        db.collection("pastas").doc(id).update({ status: "ATIVO" }).then(() => carregarAuditoria());
    }
}

function restaurarCliente(id) {
    if(confirm('Restaurar este cliente?')) {
        db.collection("clientes").doc(id).update({ status: "ATIVO" }).then(() => carregarAuditoria());
    }
}