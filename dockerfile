# Use Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install 'serve' globally to serve the production build
RUN npm install -g serve

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the production application
RUN npm run build

# Expose port 5002 to match your config
EXPOSE 5002

# Run 'serve' on port 5002
# -s handles SPA routing for React Router
# -l 5002 sets the listening port
CMD ["serve", "-s", "dist", "-l", "5002"]