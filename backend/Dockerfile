FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the application port (assuming 8000 based on standard setup and previous context)
EXPOSE 8000

# Start the application using standard node rather than nodemon for production
CMD ["node", "--experimental-json-modules", "./src/index.js"]
