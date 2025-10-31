# 🌾 FarmerMarket – Smart & Secure DevOps Delivery on AWS

Traditional agricultural e-commerce systems are often **difficult to scale, manually deployed, and less secure**.  
**FarmerMarket** is a **cloud-native, automated, and secure web application** designed to empower farmers, sellers, and consumers.  

Built on **Amazon Web Services (AWS)** with complete **DevOps automation**, it demonstrates how modern CI/CD, serverless compute, and Infrastructure as Code (IaC) can deliver **scalable, secure, and efficient** web platforms.

---

## 🚀 Features

- ☁️ **Fully Cloud-Native Architecture** on AWS  
- 🔄 **Automated CI/CD Pipeline** with GitHub Actions + OIDC  
- 🧠 **Infrastructure as Code (IaC)** using Terraform  
- 🧰 **Microservices** on ECS Fargate  
- 🔐 **Role-Based Authentication** (User / Seller / Admin)  
- ⚙️ **Continuous Monitoring** via CloudWatch & GuardDuty  
- 🧾 **End-to-End Encryption** using AWS KMS  
- 🌍 **Global Content Delivery** through CloudFront & Route 53  
- 🧩 **Scalable & Secure** application model for agriculture  

---

## 🛠️ Tech Stack

- 🎨 **Frontend** → React.js, HTML, CSS, JavaScript ![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react)
- ⚙️ **Backend** → GoTrue, PostgREST, Realtime, Storage (ECS Fargate) ![AWS](https://img.shields.io/badge/Backend-ECS%20Fargate-orange?logo=amazonaws)
- 🗄️ **Database** → Aurora PostgreSQL Serverless v2, Redis ![Postgres](https://img.shields.io/badge/Database-Aurora%20PostgreSQL-blue?logo=postgresql)
- ☁️ **IaC** → Terraform ![Terraform](https://img.shields.io/badge/IaC-Terraform-844FBA?logo=terraform)
- 🔄 **CI/CD** → GitHub Actions + OIDC ![GitHub](https://img.shields.io/badge/CI/CD-GitHub%20Actions-blue?logo=githubactions)
- 🧠 **Monitoring & Security** → CloudWatch, GuardDuty, Security Hub ![CloudWatch](https://img.shields.io/badge/Monitoring-CloudWatch-orange?logo=amazoncloudwatch)
- 🌍 **CDN & DNS** → CloudFront + Route 53 ![CloudFront](https://img.shields.io/badge/CDN-CloudFront-yellow?logo=amazoncloudfront)

---

## 📐 System Architecture

<img width="992" height="543" alt="image" src="https://github.com/user-attachments/assets/9998ab2a-98c0-4167-9012-7785b48f5937" />


**Architecture Flow:**
1. 🎨 **Frontend (React.js)** hosted on S3 and distributed via CloudFront.  
2. ⚙️ **Backend Microservices** (GoTrue, PostgREST, Realtime, Storage) deployed on ECS Fargate.  
3. 🗄️ **Database Layer** uses Aurora PostgreSQL Serverless v2 and ElastiCache Redis.  
4. ☁️ **CI/CD Pipeline** built with GitHub Actions + OIDC for passwordless AWS deploys.  
5. 🔐 **Security Layer** with IAM, KMS, and AWS WAF for protection.  
6. 📊 **Monitoring Layer** powered by CloudWatch, GuardDuty, and Security Hub.  

---

## ⚙️ Implementation Steps

1. **Infrastructure Setup (IaC)**  
   - Defined complete AWS architecture using **Terraform**.  
   - Created ECS clusters, Aurora DB, and networking configuration.  
   - Example:
     ```bash
     terraform init
     terraform apply
     ```

2. **CI/CD Pipeline**  
   - Configured **GitHub Actions** workflow using **OpenID Connect (OIDC)** for secure deployment.  
   - Automates build, test, and deploy to AWS Fargate.  

3. **Backend Deployment**  
   - Microservices containerized with Docker and deployed on ECS Fargate.  
   - Connected with Aurora DB and Redis for fast data access.

4. **Frontend Hosting**  
   - Built using React.js, hosted on **Amazon S3**, and distributed globally via **CloudFront**.  
   - Configured **Route 53** for custom domain: [https://farmermarket.online](https://farmermarket.online)

5. **Security & Monitoring**  
   - Enabled **CloudWatch** dashboards, **GuardDuty**, and **Security Hub**.  
   - Configured **AWS WAF** to block SQL injection and XSS attacks.

---

## 📊 Results

| **Feature** | **Outcome** |
|--------------|--------------|
| ⚙️ CI/CD Automation | Zero manual deployment, full automation via GitHub Actions |
| 🗄️ Infrastructure | Managed entirely as code using Terraform |
| ☁️ Scalability | Elastic scaling via ECS Fargate and Aurora Serverless |
| 🔒 Security | Multi-layered protection using IAM, WAF, KMS |
| 📈 Monitoring | Real-time performance tracking through CloudWatch |
| 🌍 Global Delivery | Fast and secure access via CloudFront CDN |

---

## 🖼️ Screenshots

**🌍 Home Page** – Farmers & consumers marketplace  
<img width="1002" height="428" alt="image" src="https://github.com/user-attachments/assets/80c631fe-7e11-4947-b936-418a178308cb" />


**🧑‍🌾 Seller Dashboard** – Manage store, add products, and view analytics  
<img width="991" height="457" alt="image" src="https://github.com/user-attachments/assets/2cc4f44f-a405-41e1-8e54-d68e18f86060" />


**📊 Admin Panel** – Monitor users, sellers, and transactions  
<img width="1001" height="480" alt="image" src="https://github.com/user-attachments/assets/aaf47a15-dfd3-462b-b8e8-7e2b3b2caf6b" />


**🛠️ User dashboard** – Displays active orders, recent purchases, and product browsing features  
<img width="1038" height="431" alt="image" src="https://github.com/user-attachments/assets/999f73c5-a836-4858-a26a-9ab155399255" />


---

## 🧩 Run Locally

To test the project locally:

### Clone Repository
```bash
git clone https://github.com/<your-username>/farmermarket.git
cd farmermarket

Start Frontend
cd frontend
npm install
npm run dev


App runs at 👉 http://localhost:3000

Start Backend
cd backend
npm install
node server.js


API runs at 👉 http://localhost:4000

Visit the frontend URL — it connects to the backend mock API locally or the AWS endpoint when deployed.

☁️ Cloud Infrastructure Summary
Component	AWS Service	Purpose
🖥️ Compute	ECS Fargate	Run containerized microservices
🗄️ Database	Aurora PostgreSQL Serverless v2	Persistent storage
⚡ Cache	ElastiCache Redis	Performance caching
🗂️ Object Storage	S3	Static assets & media
🌍 CDN & Security	CloudFront + WAF + Route 53	Global delivery & protection
🔄 CI/CD	GitHub Actions + Terraform + OIDC	Automation & IaC
🛡️ Monitoring	CloudWatch + GuardDuty + Security Hub	Logs, metrics, security compliance
⚡ Challenges Faced

Integrating OIDC authentication with GitHub Actions

Debugging Terraform resource dependencies

Setting up ECS networking and IAM roles correctly

Optimizing CloudFront cache invalidation for deployments

Ensuring secure cross-service communication via IAM

🔮 Future Enhancements
Area	Planned Improvement
📱 Mobile App	Build mobile app using React Native or Flutter
🤖 AI Features	Integrate recommendation engine for users
💳 Payment Gateway	Add secure payments via Stripe or Razorpay
🌐 Multi-Region Deployment	Add failover and geo-based routing
📈 Analytics Dashboard	Use AWS QuickSight for real-time BI reports
🧠 Serverless Automation	Add AWS Lambda for background tasks
📈 Key Results

✅ 99.95% uptime with secure HTTPS delivery
✅ 100% automated deployment pipeline
✅ Zero manual configuration on AWS console
✅ Reproducible environment using Terraform
✅ Real-time insights with CloudWatch dashboards

🧾 License & Credits

Developed by Brinda Vaghasiya (22IT150)
Under the guidance of Prof. Madhav Ajwalia
CSPIT, CHARUSAT – IT452 SGP (2025)
