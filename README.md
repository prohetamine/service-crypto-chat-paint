# Chat Paint
Creator of ⌬ʲˢ³ at [prohetamine.ru/web3](https://prohetamine.ru/web3)

This repository contains instructions to run a **local version of the Chat Paint application**.

---

## Requirements

- [Docker](https://docs.docker.com/get-docker/)

---

## Getting Started

### Build the Docker Image

```bash
docker build -t app .
```

---

## Run the Application

```bash
docker run -p 3820:3820 app
```

---

## Access the App

Open your browser and go to: http://localhost:3820
