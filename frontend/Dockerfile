# Stage 1: Build React Application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors first to cache dependencies layers
COPY package.json .

# Install dependencies using legacy-peer-deps to support React 19 warnings
RUN npm install --legacy-peer-deps

# Copy frontend source files
COPY . .

# Compile TypeScript and bundle Vite application
RUN npm run build

# Stage 2: Serve Application with Nginx
FROM nginx:alpine

# Copy built static files from build stage to Nginx content root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx routing configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
