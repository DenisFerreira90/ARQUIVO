function imprimirEspelho() {
    gerarImpressao(document.getElementById('titulo-pasta').innerText);
}

function gerarImpressao(pasta) {
    db.collection("pastas").doc(pasta).get().then(doc => {
        let endereco = "N/A", andar = "N/A", caixa = "N/A", numero = "N/A";
        
        if (doc.exists) {
            const dados = doc.data();
            endereco = dados.endereco || "N/A";
            andar = dados.andar || "N/A";
            caixa = dados.caixa || "N/A";
            numero = dados.numero || "N/A";
        }

        document.getElementById('print-pasta-id').innerText = pasta;
        document.getElementById('print-endereco').innerHTML = `<b>Endereço:</b> ${endereco}`;
        document.getElementById('print-andar').innerHTML = `<b>Andar/Sala:</b> ${andar}`;
        document.getElementById('print-caixa').innerHTML = `<b>Caixa:</b> ${caixa} &nbsp;&nbsp; <b>Nº:</b> ${numero}`;

        const linkApp = window.location.origin + window.location.pathname + "?pasta=" + pasta;
        const imgQr = document.getElementById('print-qr');
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(linkApp)}`;
        
        imgQr.onload = () => window.print();
    });
}