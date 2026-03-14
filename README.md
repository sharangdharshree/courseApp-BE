# 📚 Course Selling Platform Backend

## Live Link:

https://courseapp-be-bq2o.onrender.com/api/v1

## ✅ Project Overview

This backend powers a **Course Selling Platform**. It supports:

- User & Admin authentication via JWTs (access & refresh tokens)
- Course creation, management, and content uploading (video/doc)
- Course purchase, price management, and access control
- Media storage via **Cloudinary**
- Role-based authorization for **Admin** vs **User**
- Modular structure using **Express**, **MongoDB (Mongoose)**, and **RESTful APIs**

---

## ⚙️ Tech Stack

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT Auth (Access/Refresh tokens)**
- **Cloudinary** (for course thumbnails and content)
- **Multer** (for file upload handling)
- **Validation** via Zod schemas
- **Modular architecture** (controllers, models, routes, middlewares)

---

## 🧑‍🎓 User API Routes

| Method | Route                             | Description                | Auth | Body                                     |
| ------ | --------------------------------- | -------------------------- | ---- | ---------------------------------------- |
| `POST` | `/user/register`                  | Register a new user        | ❌   | `fullName`, `email`, `password`, `phone` |
| `POST` | `/user/login`                     | Login user & get tokens    | ❌   | `email`, `password`                      |
| `POST` | `/user/logout`                    | Logout user                | ✅   | -                                        |
| `GET`  | `/user/current-user`              | Get logged-in user info    | ✅   | -                                        |
| `POST` | `/user/refresh-token`             | Get new access token       | ✅   | -                                        |
| `PUT`  | `/user/change-password`           | Change password            | ✅   | `oldPassword`, `newPassword`             |
| `PUT`  | `/user/update-account`            | Update name                | ✅   | `fullName`                               |
| `POST` | `/user/:courseId/purchase-course` | Purchase course            | ✅   | Payment + course data                    |
| `GET`  | `/user/purchased-courses`         | List all purchased courses | ✅   | -                                        |

---

## 🧑‍💻 Admin API Routes

| Method   | Route                               | Description                       | Auth      | Body                                                      |
| -------- | ----------------------------------- | --------------------------------- | --------- | --------------------------------------------------------- |
| `POST`   | `/admin/register`                   | Register new admin                | ❌        | `fullName`, `email`, `password`, `phone`                  |
| `POST`   | `/admin/login`                      | Login admin & get tokens          | ❌        | `email`, `password`                                       |
| `POST`   | `/admin/logout`                     | Logout admin                      | ✅        | -                                                         |
| `GET`    | `/admin/current-admin`              | Get logged-in admin info          | ✅        | -                                                         |
| `POST`   | `/admin/refresh-token`              | Refresh access token              | ✅        | -                                                         |
| `PUT`    | `/admin/change-password`            | Change password                   | ✅        | `oldPassword`, `newPassword`                              |
| `PUT`    | `/admin/update-account`             | Update name                       | ✅        | `fullName`                                                |
| `POST`   | `/admin/create-course`              | Create new course                 | ✅ + File | `title`, `overview`, `description`, `category`, thumbnail |
| `PUT`    | `/admin/:courseId/update-course`    | Update course details             | ✅ + File | Same as above                                             |
| `PUT`    | `/admin/:courseId/change-thumbnail` | Update thumbnail                  | ✅ + File | New thumbnail only                                        |
| `DELETE` | `/admin/:courseId/delete-course`    | Delete course                     | ✅        | -                                                         |
| `PUT`    | `/admin/:courseId/set-price`        | Set course price                  | ✅        | `amount`                                                  |
| `PUT`    | `/admin/:courseId/publish`          | Toggle publish status             | ✅        | -                                                         |
| `GET`    | `/admin/created-courses`            | List all courses created by admin | ✅        | -                                                         |

---

## 🎓 Course & Content API (Admin + User)

| Method   | Route                                                    | Description                                     | Role       |
| -------- | -------------------------------------------------------- | ----------------------------------------------- | ---------- |
| `GET`    | `/course/:courseId/learn`                                | Get course full contents (if purchased)         | User/Admin |
| `GET`    | `/course/:courseId/dashboard`                            | Admin course dashboard with sections & contents | Admin      |
| `POST`   | `/course/:courseId/add-section`                          | Add section to course                           | Admin      |
| `PUT`    | `/course/:courseId/:sectionId/update-section`            | Update section title/desc                       | Admin      |
| `DELETE` | `/course/:courseId/:sectionId/delete-section`            | Delete section & contents                       | Admin      |
| `POST`   | `/course/:courseId/:sectionId/add-content`               | Add content to section                          | Admin      |
| `PUT`    | `/course/:courseId/:sectionId/:contentId/update-content` | Update content video/title                      | Admin      |
| `DELETE` | `/course/:courseId/:sectionId/:contentId/delete-content` | Delete content                                  | Admin      |

---

## 🌐 Public API Routes

| Method | Route                           | Description                   |
| ------ | ------------------------------- | ----------------------------- |
| `GET`  | `/public/`                      | Home page test route          |
| `GET`  | `/public/all-courses`           | List all published courses    |
| `GET`  | `/public/all-courses/:courseId` | Get a single published course |

---

## 📦 Environment Variables

Create a `.env` file in the root with the following:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017
NODE_ENV=development
ACCESS_TOKEN_SECRET=yourAccessTokenSecret
REFRESH_TOKEN_SECRET=yourRefreshTokenSecret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=yourFrontendAdd
CLOUDINARY_CLOUD_NAME=yourCloudName
CLOUDINARY_API_KEY=yourCloudinaryKey
CLOUDINARY_API_SECRET=yourCloudinarySecret
```

---

## 🛠 Local Setup Instructions

1. **Clone the repo**

```bash
git clone https://github.com/sharangdharshree/courseApp-BE.git
cd courseApp-BE
```

2. **Install dependencies**

```bash
npm install
```

3. **Set environment variables**

Create `.env` file as shown above.

4. **Start MongoDB locally**

Make sure MongoDB is running at the URI you provided.

5. **Run the server**

```bash
npm run dev
```

> Your server will run at `http://localhost:8000` (or the port you defined).

---

## 🧠 Project Structure

```
├── controllers/
├── models/
├── routes/
├── middlewares/
├── schemas/
├── utils/
├── db.js
├── server.js / index.js
└── .env
```

---

## 📂 Media Upload

- Uses **Multer** for file handling (thumbnail, videos).
- Uses **Cloudinary** to store course media.
- Media URLs and `publicId` are stored in DB for future deletion/update.

---

## 📃 Purchase Flow (User)

- Course is only accessible if `Purchase` is completed.
- System verifies:
  - Payment success
  - Stores breakdown: currency, discount, method, txn ID
- Generates **Invoice Number** (if completed)

---

## 🔐 Authentication Flow

- JWT-based auth with both `accessToken` and `refreshToken`.
- Tokens are:
  - Stored as **HttpOnly cookies**
  - Refreshed via `/refresh-token`
- Middleware: `verifyJwt` for route protection

---

## 🧪 Validation

- All critical requests are validated using Zod schemas in `/schemas`
- Example: registration, login, password updates, purchase, course data

---

## 🚀 Future Ideas

- Add support for coupon/discount engine
- Integration with Stripe/Razorpay
- Admin panel UI
- Video streaming optimizations
