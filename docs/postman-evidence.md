# Перевірка API в Postman

На скріншотах видно запит, його параметри та відповідь сервера. Запити виконані на `http://localhost:3000`.

## Без заголовків — 401

![GET /documents без заголовків](screenshots/01-unauthorized-401.png)

## Доступ користувача до /employees — 403

![GET /employees як user1](screenshots/02-employees-403.png)

## Список документів — 200

![GET /documents як user1](screenshots/03-documents-200.png)

## Список співробітників — 200

![GET /employees як admin1](screenshots/04-employees-200.png)

## Створення документа — 201

![POST /documents](screenshots/05-create-201.png)

## Запит без title — 400

![POST /documents без title](screenshots/06-validation-400.png)

## Видалення документа — 204

![DELETE /documents/1](screenshots/07-delete-204.png)

## Невідомий маршрут — 404

![GET /non-existent](screenshots/08-route-404.png)

## Перевірка 401 у браузері

У вкладці Network видно статус відповіді на `GET /documents` без заголовків авторизації.

![Статус 401 у вкладці Network](screenshots/09-browser-network-401.png)
