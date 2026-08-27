/* algorítimo

- [x] Carregar arquivo de imagem via input `type="file"`
- [x] Capturar evento de mudança (`onchange`) e selecionar o arquivo no DOM
- [x] Armazenar o arquivo em variável temporária (`let` ou `const`)
- [x] Enviar a imagem e o *prompt* de instruções para a IA do Puter.js
- [] Tratar a resposta recebida da IA (parsing do JSON/texto)
- [] Exibir os dados estruturados (valor, estabelecimento, data) na interface
- [] Tratar erros de conexão ou falhas de leitura da IA

*/

let pedido = `Analise esta foto de comprovante fiscal. Para cada item comprado, extraia em formato JSON:
- O nome exato do produto (como está impresso).
- A quantidade de unidades.
- O valor unitário.
- O valor total do item.
Extraia também o valor total da nota inteira.

/FORMATO DA NOTA: geralmente, O cupom fiscal usa 2 linhas para descrever cada item: a primeira linha contem o código do produto na loja + nome do produto e, nessa mesma linha ou na abaixo, o número de unidades (pode ser em número inteiro ou decimal (p ex: 6,00)) vezes o valor unitário e o valor total do ítem.

No modelo JSON abaixo: no 'nome' do produto exclua números, apenas letras; No 'total_nota', forneça o valor em R$ com 2 casas decimais após o ponto.
Se não for possível decifrar, não invente ítens, mantenha estritamente o que está na nota/

Siga rigorosamente este modelo JSON e retorne APENAS o JSON:
{
  "estabelecimento": "Nome",
  "data": "Data",
  "itens": [
    {
      "nome": "Nome do produto",
      "quantidade": 1,
      "preco_unitario": 0.00,
      "preco_total": 0.00
    }
  ],
  "total_nota": 0.00
}
`;

// Variáveis para acumular os valores globais
let totalGeralAcumulado = 0;
let quantidadeComprovantes = 0;

async function lerfoto() {
    let fotoInput = document.querySelector("#foto-comprovante").files[0];
    if (!fotoInput) return;
    
    console.log(fotoInput); 
    
    let resposta = await puter.ai.chat(pedido, fotoInput);
    let texto = resposta.message.content;
    console.log(texto);

    try {
        let jsonLimpo = texto.replace(/```json/g, "").replace(/```/g, "").trim();
        let dadosNota = JSON.parse(jsonLimpo);

        // 1. Atualiza os acumuladores globais
        totalGeralAcumulado += dadosNota.total_nota;
        quantidadeComprovantes += 1;

        let container = document.querySelector("#resultado-container");
        if (!container) return;
        
        let htmlItens = dadosNota.itens.map(item => `
            <div class="item-linha">
                <span>${item.nome} UN</span>
                <span>R$ ${item.preco_total.toFixed(2).replace('.', ',')}</span>
            </div>
        `).join('');

        // Criamos o elemento do novo card
        let novoCard = document.createElement('div');
        novoCard.className = 'card-comprovante';
        novoCard.innerHTML = `
            <div class="estabelecimento">🛒 ${dadosNota.estabelecimento}</div>
            <div class="lista-itens">
                ${htmlItens}
            </div>
            <hr class="divisor">
            <div class="total-nota-linha">
                <span>Total da nota</span>
                <span>R$ ${dadosNota.total_nota.toFixed(2).replace('.', ',')}</span>
            </div>
        `;

        // Adiciona o novo card no topo da lista (ou use container.appendChild para ir para o fundo)
        container.prepend(novoCard);

        // 2. Atualiza o painel superior com a soma total e quantidade correta
        document.querySelector(".p4").innerText = `R$ ${totalGeralAcumulado.toFixed(2).replace('.', ',')}`;
        
        let textoComprovantes = quantidadeComprovantes === 1 ? "1 Comprovante lido" : `${quantidadeComprovantes} Comprovantes lidos`;
        document.querySelector(".p5").innerText = textoComprovantes;

    } catch (erro) {
        console.error("Erro ao converter o JSON da IA:", erro);
        alert("Não foi possível ler o comprovante corretamente. Tente novamente.");
    }
}