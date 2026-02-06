# Build from repo root: docker build -f example-projects/shoe-inventory/Dockerfile .
FROM node:20-slim

WORKDIR /app

# Copy the dataobject package first
COPY packages/dataobject ./packages/dataobject

# Install dataobject package dependencies
WORKDIR /app/packages/dataobject
RUN npm install

# Copy shoe-inventory app
WORKDIR /app
COPY example-projects/shoe-inventory/package.json ./
COPY example-projects/shoe-inventory/tsconfig.json ./
COPY example-projects/shoe-inventory/src ./src

# Modify package.json to use local file path instead of version
RUN sed -i 's|"@agentforge/dataobject": "[^"]*"|"@agentforge/dataobject": "file:./packages/dataobject"|' package.json

# Install app dependencies
RUN npm install

# Expose port
EXPOSE 3001
ENV PORT=3001

CMD ["npx", "tsx", "src/server.ts"]
