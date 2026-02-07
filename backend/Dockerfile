FROM node:18-bullseye

WORKDIR /app

# Install build dependencies for native modules (bcrypt, pg)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose the API port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
