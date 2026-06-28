from flask import Flask, render_template, request, jsonify
from grafos import Grafo

app = Flask(__name__)
grafo = Grafo('grade.json')

@app.route('/')
def index():

    disciplinas = grafo.obter_todas_disciplinas()
    return render_template('index.html', disciplinas=disciplinas)

@app.route('/api/pre_requisitos')
def pre_requisitos():
    disciplina = request.args.get('disciplina')
    if not disciplina:
        return jsonify({"erro": "Disciplina não informada"}), 400

    resultado_dfs = grafo.dfs(disciplina)
    return jsonify({"resultado": resultado_dfs})

@app.route('/api/dependentes')
def dependentes():
    disciplina = request.args.get('disciplina')
    if not disciplina:
         return jsonify({"erro": "Disciplina não informada"}), 400

    resultado_dfs = grafo.dependentes_de(disciplina)
    return jsonify({"resultado": resultado_dfs})

@app.route('/api/distancia')
def distancia():
    origem = request.args.get('origem')
    destino = request.args.get('destino')
    
    if not origem or not destino:
        return jsonify({"erro": "Origem e destino são obrigatórios"}), 400

    resultado_bfs = grafo.bfs(origem, destino)
    return jsonify({"distancia": resultado_bfs})

if __name__ == '__main__':
    app.run(debug=True)