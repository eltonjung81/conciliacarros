from flask import Flask, jsonify, request
from flask_cors import CORS
from placafipy import PlacaFipy
import logging
import json
import sqlite3
import os
from datetime import datetime

# Configuração de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app) 

# ============================================================
# CONFIGURAÇÃO DO BANCO DE DADOS (SQLite)
# ============================================================
DB_FILE = 'leads.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            whatsapp TEXT,
            placa TEXT,
            marca TEXT,
            modelo TEXT,
            ano TEXT,
            opcao_servico TEXT,
            situacao TEXT,
            data_criacao DATETIME
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ============================================================
# CONFIGURAÇÃO: TOKEN SCRAPINGANT
# ============================================================
SCRAPINGANT_TOKENS = [
    'c20e6e79744049029a6f7af33bc47183',
]

try:
    detector = PlacaFipy(tokens=SCRAPINGANT_TOKENS)
except Exception as e:
    print(f"!!! ERRO CRITICO NA INICIALIZACAO: {e}")
    detector = None

# ROTA PARA CONSULTA DE PLACA
@app.route('/api/consulta/<placa>', methods=['GET'])
def consultar_placa(placa):
    if not detector:
        return jsonify({"error": "Detector não inicializado"}), 500
    
    print(f"\n[CONSULTA] Recebida busca para placa: {placa.upper()}")
    
    try:
        resultado = None
        for tentativa in range(2):
            try:
                print(f" -> Tentativa {tentativa + 1} para {placa}...")
                resultado = detector.consulta(placa)
                if resultado: break
            except Exception as e_inner:
                print(f" -> Erro na tentativa {tentativa + 1}: {e_inner}")
        
        if not resultado:
            return jsonify({"error": "Veiculo nao encontrado"}), 404
            
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ROTA PARA SALVAR LEADS
@app.route('/api/leads', methods=['POST'])
def salvar_lead():
    try:
        dados = request.json
        print(f"\n[LEAD] Novo lead recebido: {dados.get('nome')} - {dados.get('whatsapp')}")
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO leads (nome, whatsapp, placa, marca, modelo, ano, opcao_servico, situacao, data_criacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dados.get('nome'),
            dados.get('whatsapp'),
            dados.get('placa'),
            dados.get('marca'),
            dados.get('modelo'),
            dados.get('ano'),
            dados.get('opcao'),
            dados.get('situacao'),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        conn.commit()
        conn.close()
        
        return jsonify({"status": "sucesso", "message": "Lead salvo no banco de dados"}), 201
    except Exception as e:
        print(f"[ERRO AO SALVAR LEAD] {e}")
        return jsonify({"status": "erro", "message": str(e)}), 500

# ROTA PARA VER LEADS (Simples para o MVP)
@app.route('/api/leads/lista', methods=['GET'])
def listar_leads():
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM leads ORDER BY data_criacao DESC')
        rows = cursor.fetchall()
        leads = [dict(row) for row in rows]
        conn.close()
        return jsonify(leads)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({"status": "online", "db": os.path.exists(DB_FILE)})

if __name__ == '__main__':
    print("\n" + "="*50)
    print("SERVIDOR CONCILIA VEICULOS (API + DATABASE) ONLINE")
    print(f"Banco de dados: {os.path.abspath(DB_FILE)}")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
