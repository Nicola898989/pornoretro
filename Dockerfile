
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server files
COPY server/ ./server/

# Copy built frontend (you need to build first with npm run build)
COPY dist/ ./dist/

# Create directory for SQLite database
RUN mkdir -p /app/server/data

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "server/server.js"]
