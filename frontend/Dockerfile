FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Install serve package globally to serve the built application
RUN npm install -g serve

EXPOSE 8080

# Use serve to run the production build
CMD ["serve", "-s", "dist", "-l", "8080"]
