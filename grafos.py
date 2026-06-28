import json
from collections import deque

class Grafo:
    def __init__(self, caminho_json):
        self.adjacencias = {}
        self.pre_requisitos = {}
        self._carregar_do_json(caminho_json)

    def _carregar_do_json(self, caminho_json):
        with open(caminho_json, 'r', encoding='utf-8') as f:
            dados = json.load(f)

        self.semestres = {}

        for pre_req, info in dados.items():
            self._adicionar_vertice(pre_req)
            self.semestres[pre_req] = info["semestre"]
            
            for disciplina in info["dependentes"]:
                self._adicionar_aresta(pre_req, disciplina)

    def _adicionar_vertice(self, nome):
        if nome not in self.adjacencias:
            self.adjacencias[nome] = []
            self.pre_requisitos[nome] = []

    def _adicionar_aresta(self, pre_req, disciplina):
        self._adicionar_vertice(disciplina)
        if disciplina not in self.adjacencias[pre_req]:
            self.adjacencias[pre_req].append(disciplina)
        if pre_req not in self.pre_requisitos[disciplina]:
            self.pre_requisitos[disciplina].append(pre_req)

    def obter_todas_disciplinas(self):

        return sorted(list(self.adjacencias.keys()))

    def dfs(self, disciplina):
        visitados = set()
        ordem_correta = []
        
        def dfs_reversa(no):
            visitados.add(no)

            for vizinho in self.pre_requisitos.get(no, []):
                if vizinho not in visitados:
                    dfs_reversa(vizinho)

            if no != disciplina:
                ordem_correta.append(no)
                
        if disciplina in self.pre_requisitos:
            dfs_reversa(disciplina)
            
        return ordem_correta

    def dependentes_de(self, disciplina):
        visitados = set()
        
        def dfs(no):
            visitados.add(no)
            for vizinho in self.adjacencias.get(no, []):
                if vizinho not in visitados:
                    dfs(vizinho)
                    
        if disciplina in self.adjacencias:
            dfs(disciplina)
            visitados.discard(disciplina) 
            
        return list(visitados)

    def bfs(self, origem, destino):
        if origem not in self.adjacencias or destino not in self.adjacencias:
            return []

        fila = deque([[origem]])
        visitados = {origem}
        
        while fila:
            caminho = fila.popleft()
            no_atual = caminho[-1]
            
            if no_atual == destino:
                return caminho
                
            for vizinho in self.adjacencias.get(no_atual, []):
                if vizinho not in visitados:
                    visitados.add(vizinho)
                    novo_caminho = list(caminho)
                    novo_caminho.append(vizinho)
                    fila.append(novo_caminho)
                    
        return []