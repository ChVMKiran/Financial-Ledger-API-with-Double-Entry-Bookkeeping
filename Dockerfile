FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

ENV PORT=3000
EXPOSE 3000

# Run migrations (if any) and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
