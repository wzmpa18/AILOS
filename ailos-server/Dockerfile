# ============================================
# AILOS NestJS 生产 Dockerfile
# 多阶段构建，最小化镜像体积
# ============================================

# ---- 构建阶段 ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /prod_modules
RUN npm ci

COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx nest build
RUN npx prisma generate

# ---- 运行阶段 ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S ailos && adduser -S ailos -u 1001 -G ailos

COPY --from=builder /prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./

USER ailos

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
