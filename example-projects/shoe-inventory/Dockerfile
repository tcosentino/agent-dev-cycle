# Build from repo root: docker build -f example-projects/shoe-inventory/Dockerfile .
FROM node:20-slim

WORKDIR /app

# Copy the resource package first
COPY packages/resource ./packages/resource

# Install resource package dependencies
WORKDIR /app/packages/resource
RUN npm install

# Copy shoe-inventory app
WORKDIR /app
COPY example-projects/shoe-inventory/package.json ./
COPY example-projects/shoe-inventory/tsconfig.json ./
COPY example-projects/shoe-inventory/src ./src

# Modify package.json to use local file path instead of version
RUN sed -i 's|"@agentforge/resource": "[^"]*"|"@agentforge/resource": "file:./packages/resource"|' package.json

# Install app dependencies
RUN npm install

# Expose port
EXPOSE 3001
ENV PORT=3001

CMD ["npx", "tsx", "src/server.ts"]
