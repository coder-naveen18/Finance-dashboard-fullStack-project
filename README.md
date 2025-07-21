# FinDash - Personal Finance Dashboard

**FinDash** is a modern, full-stack web application designed to help you manage your personal finances with ease. It provides a clean, intuitive dashboard to track your income, expenses, savings, and financial accounts in one place.

## ✨ Features

* **Secure User Authentication**: Full signup and login functionality using JWT (JSON Web Tokens) for secure, session-based authentication.
* **Interactive Dashboard**: At-a-glance overview of your total balance, monthly income, expenses, and savings.
* **Live Data Visualization**: A dynamic bar chart displays your income vs. expenses over the last 12 months.
* **Transaction Management**: Add new income or expense transactions, and view a complete, searchable history of all your transactions.
* **Card Management**: Securely save and manage your credit/debit card information (only stores the last 4 digits).
* **Savings Goals**: Create and track your progress towards multiple savings goals.
* **Customizable Settings**:
    * Update your profile information (name and email).
    * Change your password securely.
    * Update your avatar.
    * Toggle preferences for notifications and dark mode.
* **Persistent Preferences**: Your choices for Dark Mode and avatar are saved to your user profile in the database.
* **Responsive Design**: A clean and modern UI that works beautifully on desktops, tablets, and mobile devices.

## 🛠️ Tech Stack

This project is built with a modern, full-stack architecture using the following technologies:

### Frontend

* **HTML5**: The core structure of the web pages.
* **Tailwind CSS**: A utility-first CSS framework for rapid and responsive UI development.
* **JavaScript (ES6+)**: Handles all client-side logic, API requests, and DOM manipulation.
* **Chart.js**: For creating beautiful and interactive charts.
* **Lucide Icons**: A clean and consistent icon set.

### Backend

* **Node.js**: A JavaScript runtime for building the server-side application.
* **Express.js**: A fast and minimalist web framework for Node.js, used to build the REST API.
* **MySQL**: The relational database used for storing all application data.
* **JWT (jsonwebtoken)**: For implementing secure user authentication and authorization.
* **bcrypt.js**: For hashing user passwords securely before storing them.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* **Node.js** (v14 or later recommended)
* **NPM** (comes with Node.js)
* A **MySQL** server (e.g., via XAMPP, MAMP, or MySQL Community Server)
* A database management tool like **MySQL Workbench** or **DBeaver** (recommended).

### 1. Backend Setup

1.  **Clone the repository** (or download the source code).
2.  **Navigate to the backend directory**:
    ```
    cd /path/to/your/backend-folder
    ```
3.  **Install dependencies**:
    ```
    npm install
    ```
4.  **Create a `.env` file** in the root of the backend directory. This file will store your secret credentials. Add the following content to it, replacing the placeholder values with your actual database credentials:
    ```
    # Database Configuration
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_NAME=finance_dashboard

    # JWT Secret Key
    JWT_SECRET=a_very_secure_and_long_secret_key_for_jwt
    ```
    > **Important**: `JWT_SECRET` should be a long, random, and secret string for a production environment.

### 2. Database Setup

1.  **Create the Database**: Open your MySQL client and run the following command to create the database:
    ```
    CREATE DATABASE finance_dashboard;
    ```
2.  **Create Tables and Seed Data**: Select the `finance_dashboard` database and run the entire `database-schema.sql` script provided with the project. This will create all the necessary tables (`users`, `accounts`, `transactions`, etc.) and insert some sample data to get you started.

### 3. Running the Application

1.  **Start the Backend Server**: In your backend directory's terminal, run:
    ```
    node server.js
    ```
    You should see a confirmation message: `🚀 Server is running on http://localhost:3001`.
2.  **Launch the Frontend**: Simply open the `signup.html` or `login.html` file in your web browser to start using the application.

## 📖 API Endpoints

All data-related endpoints are protected and require a valid JWT in the `Authorization` header.

| Endpoint                | Method   | Description                                  | Protected |
| ----------------------- | -------- | -------------------------------------------- | --------- |
| `/api/auth/signup`      | `POST`   | Register a new user.                         | No        |
| `/api/auth/login`       | `POST`   | Log in a user and receive a JWT.             | No        |
| `/api/summary`          | `GET`    | Get dashboard summary stats.                 | Yes       |
| `/api/chart-data`       | `GET`    | Get data for the 12-month spending chart.    | Yes       |
| `/api/transactions`     | `GET`    | Get a list of recent transactions.           | Yes       |
| `/api/transactions/all` | `GET`    | Get all transactions for the user.           | Yes       |
| `/api/transactions`     | `POST`   | Add a new transaction.                       | Yes       |
| `/api/cards`            | `GET`    | Get all saved cards.                         | Yes       |
| `/api/cards`            | `POST`   | Add a new card.                              | Yes       |
| `/api/cards/:cardId`    | `DELETE` | Delete a specific card.                      | Yes       |
| `/api/savings`          | `GET`    | Get all savings goals.                       | Yes       |
| `/api/savings`          | `POST`   | Add a new savings goal.                      | Yes       |
| `/api/user`             | `GET`    | Get user profile information.                | Yes       |
| `/api/user`             | `PUT`    | Update user profile information.             | Yes       |
| `/api/user/password`    | `PUT`    | Update user password.                        | Yes       |
| `/api/user/avatar`      | `PUT`    | Update user avatar URL.                      | Yes       |
| `/api/user/preferences` | `PUT`    | Update user preferences (theme, etc.).       | Yes       |


