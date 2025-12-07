# Stage 1: Build the application
FROM node:20-slim AS build

# Build arguments for Vite environment variables
ARG VITE_GEMINI_API_KEY
ARG VITE_RAG_API_URL

# Set as environment variables for Vite build
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_RAG_API_URL=$VITE_RAG_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build



# Stage 2: Serve the application
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Copy the nginx config file
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
