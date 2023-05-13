# Установить базовый образ
FROM node:18.16.0

# Установить рабочую директорию в контейнере
WORKDIR /app

# Копировать файлы package.json и package-lock.json в контейнер
COPY package*.json ./

# Установить зависимости
RUN npm ci

# Копировать все файлы проекта в контейнер
COPY . .

# Установить переменную окружения для токена Telegram-бота
ENV PORT=3000

# Запустить приложение
CMD [ "npm", "start" ]
