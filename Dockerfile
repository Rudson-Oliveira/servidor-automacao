# Dockerfile otimizado para Render com TensorFlow
FROM node:22-alpine

# Instalar dependências do sistema necessárias para TensorFlow e build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    libc6-compat \
    gcompat

# Instalar pnpm globalmente
RUN npm install -g pnpm@10.4.1

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração de dependências
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependências (incluindo TensorFlow com build nativo)
RUN pnpm install --frozen-lockfile

# Copiar TODO o código fonte (server + client + shared + drizzle)
COPY . .

# Build do frontend (Vite) e backend (esbuild)
# Vite vai buildar o client e colocar em dist/
# esbuild vai compilar o server e colocar em dist/index.js
RUN pnpm build

# Criar diretórios necessários para runtime
RUN mkdir -p logs screenshots downloads

# Expor porta 3000 (padrão do Render)
EXPOSE 3000

# Health check para o Render saber quando o serviço está pronto
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
# Usa o script "start" do package.json que roda: node dist/index.js
CMD ["pnpm", "start"]
