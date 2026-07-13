# Project Setup Guide

This guide provides the necessary steps to get the `projectAlp` application running locally using Docker.

## Prerequisites
- **Docker** and **Docker Compose** must be installed on your system and running.
- Ensure that ports **3000** (used by the frontend) and **8000** (used by the backend) are not occupied by other applications or containers.

## Steps to Start the Project

1. Open your terminal or command prompt.
2. Navigate to the root directory of the project:
   ```bash
   cd "c:\DTU Project\projectAlp"
   ```
3. Run the following command to build the images and start the containers in the background:
   ```bash
   docker-compose up -d --build
   ```

## Application Links

Once the Docker containers are successfully up and running, you can access the application components via your web browser:

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (Username: `minioadmin` / Password: `minioadmin`)

## Useful Docker Commands

- **Stop the application:**
  ```bash
  docker-compose down
  ```
- **View live logs for all services:**
  ```bash
  docker-compose logs -f
  ```
- **Restart the application:**
  ```bash
  docker-compose restart
  ```
