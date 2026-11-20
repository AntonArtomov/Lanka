FROM node:24-alpine
WORKDIR /app
# Залежностей немає: Node 24 запускає .ts напряму (type stripping)
COPY package.json ./
COPY src/ src/
COPY data/ data/
USER node
EXPOSE 8080
CMD ["node", "src/server.ts"]
