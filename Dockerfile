# Use a lightweight Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend assets
RUN npm run build

# Expose the port (Cloud Run will set this dynamically)
EXPOSE 8080

# Start the application using the start script we added to package.json
CMD ["npm", "start"]
