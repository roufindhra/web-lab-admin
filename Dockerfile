# Stage 1: Build aplikasi
FROM node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Web Server Nginx
FROM nginx:alpine
# Sesuaikan 'dist' jika framework Anda menghasilkan folder 'build' (misal React lama)
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
