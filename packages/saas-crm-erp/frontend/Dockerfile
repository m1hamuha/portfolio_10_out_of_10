# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Экспортируем порт (по умолчанию для Next.js)
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
