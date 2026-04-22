# 🚀 Guia de Operação - Concilia Veículos

Siga estes passos sempre que reiniciar o PC ou quiser colocar o site no ar (Netlify + Backend Local).

## 1. No seu Computador (Backend)
1. Abra o terminal na pasta do projeto.
2. Inicie o servidor Python:
   ```powershell
   python server.py
   ```
3. Abra um **segundo terminal** e inicie o Ngrok:
   ```powershell
   ngrok http 5000
   ```
4. O Ngrok vai te mostrar algo como `Forwarding: https://xxxx-xxxx.ngrok-free.app`.
5. **Copie esse endereço HTTPS.**

## 2. No GitHub / Site
1. Abra o arquivo `js/config.js`.
2. Na linha do `API_BASE`, cole a URL que você copiou:
   ```javascript
   API_BASE: "https://xxxx-xxxx.ngrok-free.app",
   ```
3. Salve o arquivo e envie para o GitHub:
   ```powershell
   git add js/config.js
   git commit -m "Atualizando URL do Ngrok"
   git push origin main
   ```

## 3. Verificação
O Netlify vai detectar a mudança no GitHub e atualizar o site em 1 minuto. Pronto! Seu site na nuvem agora consegue conversar com o banco de dados no seu PC.

---

### 📁 Onde estão os dados?
Todos os leads capturados estão salvos no arquivo `leads.db` na sua pasta local. Não apague esse arquivo!
