# 🏗 Construction Tech AI (CTAI)

[🔗 **GitHub Repository**](https://github.com/Subicharan1018/ctai) · [🌐 **Deployed Solution (Ngrok)**](https://xglink.ve rcel.app/)

An AI-powered platform designed to transform the **construction industry** with smart insights, automation, and real-time project assistance.  
This project uses cleaned construction datasets to support tasks such as `MasterItemNo` classification and `QtyShipped` regression, and provides an interactive interface via **Streamlit**.

---

## 📌 Overview
Construction projects often face challenges such as delays, cost overruns, and mismanagement. **CTAI** helps tackle these challenges by:  
- 📊 Providing data-driven recommendations.  
- ⚡ Automating repetitive tasks.  
- 🧠 Offering AI-powered decision support.  
- 🌍 Deploying a user-friendly interface accessible on **Streamlit**.

---

## 🎯 Objectives
- Simplify **construction project tracking**.  
- Enable **real-time collaboration** across teams.  
- Use AI to provide **insights and risk predictions**.  
- Make the solution easily accessible through the cloud.

---

## 🛠 Installation & Setup

Follow the steps below to set up the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/Subicharan1018/ctai.git
cd ctai
cd xgboost
```

### 2. Install Dependencies
```bash
pip install streamlit pandas numpy scikit-learn joblib sentence-transformers faiss-cpu requests python-dotenv pyngrok matplotlib python-dateutil
```

### 3. Set Up Environment Variables
Create a `.env` file in the project directory and add your Groq API key:
```env
GROQ_API_KEY=your_groq_api_key_here
```

---
## To generate the submission.csv file Run the xgboost_sep1.ipynb file to generate the submission.csv file

## ▶️ How to Run the Code

### Option 1: Run with Streamlit (Recommended)
```bash
streamlit run app.py
```

### Option 2: Run with Ngrok Tunnel
```bash
python ngrok_app.py
```

### Option 3: Run Command Line Interface
```bash
python run.py
```

---

## 🌐 Deployed Solutions
- **Ngrok Deployment**: [https://xglink.vercel.app/](https://xglink.vercel.app/)

---

## 📁 Project Structure

- `app.py`: Main Streamlit application
- `ngrok_app.py`: Streamlit application with Ngrok tunneling
- `run.py`: Command-line interface for predictions
- `xgboost_sep1.ipynb`: Jupyter notebook with model training
- `json/`: Directory containing product data in JSON format
- `*.pkl`: Pre-trained models and preprocessing objects

---

## 🤖 Features

- **Smart Procurement Planning**: Get material estimates based on project specifications
- **Vendor Identification**: Find suppliers with specific criteria (location, ratings, etc.)
- **Procurement Timeline**: Generate lead times and delivery schedules
- **Project Scheduling**: Integrated construction schedule with Gantt charts
- **ML Predictions**: Predict item classifications and quantities using XGBoost models

---

## 📚 Usage

1. Enter project details in the text area (e.g., "25 MegaWatt, 2 Lacs SquareFoot Built Up Area, Project Volume of 1875 Cr in Rupees, Build in Navi Mumbai Area")
2. Click "Generate Procurement Plan"
3. View material estimates, vendor information, timelines, and schedules