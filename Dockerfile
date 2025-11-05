FROM node:20-slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY src ./src

# Build TypeScript
RUN npm run build

# Create reports directory
RUN mkdir -p reports

# Expose port
EXPOSE 8000

# Start API
CMD ["npm", "start"]
