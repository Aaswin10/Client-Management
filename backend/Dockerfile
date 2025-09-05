FROM node:24-alpine

WORKDIR /app

# Install system dependencies for Prisma and OpenSSL
RUN apk add --no-cache openssl

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client with linux-musl target
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run migrations, seed the database, and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed && npm run start:prod"]
