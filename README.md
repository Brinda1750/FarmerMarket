# 🌾 FarmerMarket – Smart & Secure DevOps Delivery on AWS

**Project Title:** Smart and Secure DevOps Delivery on AWS for Safe Web App  
**Student:** Brinda Vaghasiya (22IT150)  
**Guide:** Prof. Madhav Ajwalia  
**Department:** Information Technology, CSPIT – CHARUSAT  
**Course Code:** IT452 (7th Semester SGP)  
**Year:** 2025

---

## 🔗 Live Project

**Access the live deployed project here:**  
👉 [https://farmermarket.online/](https://farmermarket.online/)

The project is deployed on **Amazon Web Services (AWS)** using a complete **DevOps CI/CD pipeline**.

---

## 🧩 Project Overview

FarmerMarket is a **cloud-native e-commerce platform** designed for farmers, sellers, and consumers.  
It uses **AWS cloud**, **Terraform Infrastructure as Code (IaC)**, and **GitHub Actions with OpenID Connect (OIDC)** for fully automated, credential-free deployment.

### 🔒 Key Features
- Secure, role-based authentication (User, Seller, Admin)
- Automated CI/CD using GitHub Actions + OIDC  
- AWS-based microservices (ECS Fargate, Aurora PostgreSQL, Redis, S3)  
- CloudFront + WAF for global delivery and security  
- Real-time analytics dashboard and monitoring (CloudWatch, GuardDuty)

---

## ⚙️ How the Project Runs

### 🖥️ 1. **Frontend (React.js)**
- Built using React.js and hosted on **Amazon S3**.  
- Distributed globally through **Amazon CloudFront** for low-latency access.  
- Connects to backend APIs securely over HTTPS.

### 🧠 2. **Backend (Microservices Architecture)**
- Runs on **Amazon ECS Fargate** containers.  
- Services include:
  - **GoTrue** (Authentication)
  - **PostgREST** (APIs)
  - **Realtime** (WebSocket updates)
  - **Storage** (File handling)
- Data stored in **Aurora PostgreSQL** and **Redis**.

### 🧰 3. **CI/CD Pipeline**
- Every code push triggers **GitHub Actions**.  
- The workflow:
  1. Builds Docker images and pushes to AWS ECR.  
  2. Deploys automatically to ECS Fargate using Terraform.  
  3. Invalidates CloudFront cache for instant updates.  

This ensures **continuous integration, deployment, and zero downtime.**

---

## 🚀 Run Locally (for demonstration)

To run FarmerMarket locally for demo or testing:

### **Clone Repository**
```bash
git clone https://github.com/<your-username>/farmermarket.git
cd farmermarket

# 🌾 FarmerMarket – Smart & Secure DevOps Delivery on AWS

---

## 🖥️ Start Frontend

```bash
cd frontend
npm install
npm run dev

🧠 Start Backend
cd backend
npm install
node server.js


API runs at: http://localhost:4000

📊 View Dashboard

Visit the frontend URL — it connects to the backend mock API locally or the AWS endpoint when deployed.

☁️ Cloud Infrastructure Summary
Component	AWS Service	Purpose
Compute	ECS Fargate	Run containerized microservices
Database	Aurora PostgreSQL Serverless v2	Persistent storage
Cache	ElastiCache Redis	Performance caching
Object Storage	S3	Static assets & media
CDN & Security	CloudFront + WAF + Route 53	Global delivery & protection
CI/CD	GitHub Actions + Terraform + OIDC	Automation & Infrastructure as Code
Monitoring	CloudWatch + GuardDuty + Security Hub	Logs, metrics, security compliance

📈 Results

✅ Automated end-to-end deployment
✅ 99.95% uptime & secure HTTPS delivery
✅ Scalable architecture using IaC
✅ Real-time performance monitoring via CloudWatch

🧾 License & Credits

Developed by Brinda Vaghasiya (22IT150)
Under the guidance of Prof. Madhav Ajwalia
CSPIT, CHARUSAT – IT452 SGP (2025)
