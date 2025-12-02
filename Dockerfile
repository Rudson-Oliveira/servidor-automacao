# Multi-stage build para otimizar tamanho da imagem
# IMPORTANTE: Usando Debian (bullseye-slim) em vez de Alpine porque TensorFlow precisa de glibc
FROM node:22-bullseye-slim AS base

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Stage 2: Instalar dependências
FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build do frontend e backend
RUN pnpm build

# Stage 4: Production
FROM node:22-bullseye-slim AS production

# Instalar apenas dependências de runtime necessárias para TensorFlow
RUN apt-get update && apt-get install -y \
    python3 \
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgif7 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# Copiar apenas o necessário para produção
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared

# Criar diretórios necessários
RUN mkdir -p logs screenshots downloads

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["pnpm", "start"]
