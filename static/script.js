let network = null;
let nodesDataSet = new vis.DataSet();
let edgesDataSet = new vis.DataSet();
let todasDisciplinas = [];

async function inicializarGrafo() {
    try {
        const response = await fetch('/api/grade');
        const dadosAPI = await response.json();

        const corPadrao = { background: '#ffffff', border: '#cbd5e1' };
        const corFonte = '#1e293b';

        const espacoX = 220;
        const espacoY = 90;  
        let contadorPorSemestre = {}; 

        for (let materia in dadosAPI) {
            let info = dadosAPI[materia];
            let semestreAtual = info.semestre;
            
            if (contadorPorSemestre[semestreAtual] === undefined) {
                contadorPorSemestre[semestreAtual] = 0;
            }

            let posX = semestreAtual * espacoX;
            let posY = contadorPorSemestre[semestreAtual] * espacoY;

            nodesDataSet.add({
                id: materia,
                label: materia,
                x: posX, 
                y: posY, 
                shape: 'box',
                widthConstraint: { minimum: 120, maximum: 120 },
                heightConstraint: { minimum: 60 },
                color: corPadrao,
                font: { color: corFonte, face: 'Inter', size: 12, bold: true },
                borderWidth: 2,
                shadow: true
            });
            todasDisciplinas.push(materia);
            contadorPorSemestre[semestreAtual]++;
        }

        for (let origem in dadosAPI) {
            let dependentes = dadosAPI[origem].dependentes;
            for (let destino of dependentes) {
                edgesDataSet.add({
                    id: `${origem}->${destino}`, 
                    from: origem,
                    to: destino,
                    arrows: 'to',
                    color: { color: '#cbd5e1', opacity: 0.8 },
                    smooth: { 
                        type: 'cubicBezier', 
                        forceDirection: 'horizontal',
                        roundness: 0.4
                    }
                });
            }
        }

        const container = document.getElementById('mynetwork');
        const data = { nodes: nodesDataSet, edges: edgesDataSet };
        
        const options = {
            physics: false, 
            layout: { hierarchical: false },
            interaction: { dragNodes: false, zoomView: true, dragView: true }
        };

        network = new vis.Network(container, data, options);
        
        network.once('afterDrawing', function() {
            network.fit({ animation: false, padding: 30 });
        });

    } catch (erro) {
        console.error("Erro ao carregar o grafo:", erro);
        alert("Ocorreu um erro ao gerar o gráfico. Verifique o console.");
    }
}

function limparBuscas() {
    document.getElementById('req-disciplina').value = "";
    document.getElementById('dep-disciplina').value = "";
    document.getElementById('bfs-origem').value = "";
    document.getElementById('bfs-destino').value = "";

    document.getElementById('req-resultado').innerText = "Aguardando...";
    document.getElementById('dep-resultado').innerText = "Aguardando...";
    document.getElementById('bfs-resultado').innerText = "Aguardando...";

    destacarGrafo([]);
}

function destacarGrafo(nosParaDestacar, caminhoExato = null) {
    const atualizacoesNos = [];
    const atualizacoesArestas = [];
    
    const isReset = nosParaDestacar.length === 0;

    for (let materia of todasDisciplinas) {
        if (isReset) {
            atualizacoesNos.push({
                id: materia,
                color: { background: '#ffffff', border: '#cbd5e1' },
                font: { color: '#1e293b' },
                opacity: 1,
                borderWidth: 2
            });
        } else if (nosParaDestacar.includes(materia)) {
            atualizacoesNos.push({
                id: materia,
                color: { background: '#eff6ff', border: '#2563eb' },
                font: { color: '#1d4ed8' },
                opacity: 1,
                borderWidth: 3
            });
        } else {
            atualizacoesNos.push({
                id: materia,
                color: { background: '#f8fafc', border: '#e2e8f0' },
                font: { color: '#94a3b8' },
                opacity: 0.2,
                borderWidth: 1
            });
        }
    }
    nodesDataSet.update(atualizacoesNos);

    const todasArestas = edgesDataSet.get();
    todasArestas.forEach(aresta => {
        if (isReset) {
            atualizacoesArestas.push({
                id: aresta.id,
                color: { color: '#cbd5e1', opacity: 0.8 },
                width: 1
            });
        } else {
            let deveDestacar = false;

            if (caminhoExato) {
                for (let i = 0; i < caminhoExato.length - 1; i++) {
                    if (aresta.from === caminhoExato[i] && aresta.to === caminhoExato[i+1]) {
                        deveDestacar = true;
                        break;
                    }
                }
            } else {
                if (nosParaDestacar.includes(aresta.from) && nosParaDestacar.includes(aresta.to)) {
                    deveDestacar = true;
                }
            }

            if (deveDestacar) {
                atualizacoesArestas.push({
                    id: aresta.id,
                    color: { color: '#2563eb', opacity: 1 },
                    width: 3
                });
            } else {
                atualizacoesArestas.push({
                    id: aresta.id,
                    color: { color: '#cbd5e1', opacity: 0.15 },
                    width: 1
                });
            }
        }
    });
    edgesDataSet.update(atualizacoesArestas);

    if (!isReset) {
        network.fit({ nodes: nosParaDestacar, animation: { duration: 800 }, padding: 50 });
    } else {
        network.fit({ animation: { duration: 800 }, padding: 30 });
    }
}

async function buscarPreRequisitos() {
    const disciplina = document.getElementById('req-disciplina').value;
    if (!disciplina) return;

    const response = await fetch(`/api/pre_requisitos?disciplina=${encodeURIComponent(disciplina)}`);
    const data = await response.json();
    
    document.getElementById('req-resultado').innerText = data.resultado.length > 0 ? data.resultado.join(' -> ') : 'Sem pré-requisitos.';
    destacarGrafo([...data.resultado, disciplina]);
}

async function buscarDependentes() {
    const disciplina = document.getElementById('dep-disciplina').value;
    if (!disciplina) return;

    const response = await fetch(`/api/dependentes?disciplina=${encodeURIComponent(disciplina)}`);
    const data = await response.json();
    
    document.getElementById('dep-resultado').innerText = data.resultado.length > 0 ? data.resultado.join(', ') : 'Sem dependentes.';
    destacarGrafo([...data.resultado, disciplina]);
}

async function buscarDistancia() {
    const origem = document.getElementById('bfs-origem').value;
    const destino = document.getElementById('bfs-destino').value;
    if (!origem || !destino) return;

    const response = await fetch(`/api/distancia?origem=${encodeURIComponent(origem)}&destino=${encodeURIComponent(destino)}`);
    const data = await response.json();
    
    if (data.distancia !== -1) {
        document.getElementById('bfs-resultado').innerText = `${data.distancia} semestre(s)`;
        destacarGrafo(data.caminho, data.caminho); 
    } else {
        document.getElementById('bfs-resultado').innerText = 'Sem conexão.';
        destacarGrafo([origem, destino]);
    }
}

window.addEventListener('load', inicializarGrafo);