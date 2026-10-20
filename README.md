# secure-api-lab

Навчальний REST API на Node.js та Express для роботи з документами. Користувач може переглядати, додавати й видаляти документи. Список співробітників доступний лише адміністратору. Дані зберігаються в пам’яті й відновлюються після перезапуску сервера.

Репозиторій: [github.com/Allighierri/secure-api-lab](https://github.com/Allighierri/secure-api-lab).

## Запуск

Потрібен Node.js 18 або новіший.

```bash
npm install
npm start
```

Сервер працює за адресою `http://localhost:3000`.

## Доступ

Для захищених маршрутів передайте заголовки `X-Login` та `X-Password`.

| Логін | Пароль | Роль |
| --- | --- | --- |
| `user1` | `password123` | користувач |
| `admin1` | `password123` | адміністратор |

Ці облікові записи призначені лише для лабораторної роботи.

## Маршрути

| Метод і маршрут | Що робить | Заголовки | Тіло | Статуси |
| --- | --- | --- | --- | --- |
| `GET /` | Перевіряє роботу сервера | Не потрібні | — | `200 OK` |
| `GET /documents` | Повертає документи | `X-Login`, `X-Password` | — | `200 OK`, `401 Unauthorized` |
| `POST /documents` | Створює документ | `X-Login`, `X-Password`, `Content-Type: application/json` | `{"title":"Test Doc","content":"..."}` | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| `DELETE /documents/:id` | Видаляє документ | `X-Login`, `X-Password` | — | `204 No Content`, `401 Unauthorized`, `404 Not Found` |
| `GET /employees` | Повертає співробітників; лише адміністратор | `X-Login: admin1`, `X-Password: password123` | — | `200 OK`, `401 Unauthorized`, `403 Forbidden` |

Для `POST /documents` потрібні заголовок `Content-Type: application/json` і тіло запиту:

```json
{
  "title": "Test Doc",
  "content": "Текст документа"
}
```

Поля `title` і `content` мають бути непорожніми рядками. Якщо облікові дані відсутні або неправильні, сервер повертає `401`. Користувач `user1` отримає `403` при зверненні до `/employees`. Невідомий маршрут повертає `404`.

Наприклад, отримати документи можна так:

```bash
curl http://localhost:3000/documents \
  -H 'X-Login: user1' \
  -H 'X-Password: password123'
```

## Перевірка

Запустіть сервер, а в іншому терміналі виконайте:

```bash
npm test
```

Скрипт `test-client.js` виконує 35 перевірок, зокрема доступ за ролями, валідацію, створення та видалення документів. Колекція для Postman знаходиться в [docs/secure-api-lab.postman_collection.json](docs/secure-api-lab.postman_collection.json). Імпортуйте її в Postman та виконайте запити за порядком. Перед повторним запуском колекції перезапустіть сервер, оскільки один із запитів видаляє документ з ID `1`.

[Скріншоти запитів у Postman](docs/postman-evidence.md) показують основні успішні відповіді та помилки `400`, `401`, `403` і `404`.
