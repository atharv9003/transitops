FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/index.js"]
def login(username, password):
    # Intentional bug & security risk:
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    file = open("users.txt", "r")  # Unclosed resource leak
    data = file.read()
    return query
