# 🚀 Guia de Deploy: Supabase Self-Hosted + DRVault na VPS

Este guia contém o passo a passo completo para hospedar o banco de dados Supabase e a aplicação DRVault diretamente na sua VPS Linux (Ubuntu / Debian / AlmaLinux / Docker).

---

## 📋 Pré-requisitos na VPS

1. **VPS com Docker e Docker Compose instalados**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl git
   curl -fsSL https://get.docker.com | sh
   sudo systemctl enable --now docker
   ```

2. **Portas liberadas no Firewall (UFW / Security Group)**:
   - `80` (HTTP do Frontend)
   - `8000` (Painel Supabase Studio)
   - `8443` (API Gateway do Supabase / Kong)

---

## 🛠️ Passo 1: Subir o Supabase Self-Hosted na VPS

1. Clone o repositório ou copie a pasta do projeto para a sua VPS:
   ```bash
   git clone https://github.com/Ender-ss/drvault.git
   cd drvault/supabase-vps
   ```

2. Gere as chaves de segurança automáticas:
   ```bash
   node generate-keys.mjs
   ```
   *(Este comando criará o arquivo `.env` com senhas fortes, `JWT_SECRET`, `ANON_KEY` e `SERVICE_ROLE_KEY`)*

3. Edite o arquivo `.env` para colocar o IP ou Domínio da sua VPS:
   ```bash
   nano .env
   ```
   Ajuste a linha:
   ```env
   API_EXTERNAL_URL=http://SEU_IP_OU_DOMINIO:8443
   ```

4. Inicie os containers do Supabase:
   ```bash
   docker compose up -d
   ```

5. Verifique o status dos serviços:
   ```bash
   docker compose ps
   ```

---

## 🗄️ Passo 2: Acessar o Supabase Studio e Verificar o Banco

- Acesse no seu navegador: `http://SEU_IP_DA_VPS:8000`
- O script `supabase_vps_schema.sql` já inicializa automaticamente as tabelas:
  - `media_items`
  - `copies`
  - `user_favorites`
  - Bucket de storage `thumbnails`
  - Políticas de RLS (Row Level Security)

Se precisar importar os dados das copies e mídias antigas:
1. Abra o **SQL Editor** no painel Studio (`http://SEU_IP_DA_VPS:8000`).
2. Cole o conteúdo de `migrate_data.sql` e execute.

---

## 🌐 Passo 3: Subir a Aplicação DRVault Frontend

1. Na raiz do projeto (`cd /caminho/drvault`), crie ou configure o `.env`:
   ```bash
   nano .env
   ```
   Insira as variáveis apontando para a sua VPS:
   ```env
   VITE_SUPABASE_URL=http://SEU_IP_DA_VPS:8443
   VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_GERADA_NO_PASSO_1
   ```

2. Suba o container do Frontend:
   ```bash
   docker compose up -d --build
   ```

3. Pronto! Acesse no navegador:
   `http://SEU_IP_DA_VPS:3000` (ou porta 80).

---

## 🔒 Dica: Usando Domínio e SSL com Nginx / Traefik / Cloudflare
Se desejar usar domínios com HTTPS gratuito:
- Aponte `app.seudominio.com` para a porta 3000.
- Aponte `api.seudominio.com` para a porta 8443.
- Aponte `studio.seudominio.com` para a porta 8000 (com proteção de senha básica).
