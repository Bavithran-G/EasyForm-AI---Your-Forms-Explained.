# 📄 EasyForm AI — AI-Powered Government Form Assistant

An intelligent document assistance platform that transforms complex government forms into a simple, understandable, and interactive experience. EasyForm AI uses **LLMs, RAG, document intelligence, and multilingual support** to help users understand confusing form fields, instructions, and requirements without losing the context of the original document.

---

## 🌐 Live Demo

Try the application here : **[Add Your Deployed URL]**

> EasyForm AI is developed as part of the **INTELLIX: LLM & AI Optimization Hackathon**.

---

## ✨ Features

| Feature                        | Description                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| 🤖 AI Form Assistant           | Intelligent AI assistant that helps users understand government forms               |
| 📄 Interactive Document Viewer | View the original uploaded document while interacting with the AI                   |
| 🔍 Field-Level Understanding   | Select specific fields and receive contextual explanations                          |
| 🧠 LLM-Powered Assistance      | Uses Large Language Models to understand and explain complex form content           |
| 📚 RAG-Based Responses         | Retrieves relevant information from the uploaded document before generating answers |
| 🔎 Smart Context Retrieval     | Finds the most relevant document sections for each user query                       |
| 💬 Interactive Q&A             | Ask questions about specific fields or instructions in natural language             |
| 🌐 Multilingual Support        | Supports English and Tamil for improved accessibility                               |
| 🛡 Grounded AI Responses       | Reduces hallucination by grounding responses in document context                    |
| ⚠️ Information Verification    | Clearly indicates when required information cannot be found in the document         |
| 📱 Responsive Interface        | Designed for a smooth experience across different screen sizes                      |
| ✨ User-Friendly Experience     | Simplifies complex government forms without modifying the original document         |

---

# 🚀 Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Bavithran-G/EasyForm-AI.git

cd EasyForm-AI
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Environment

**Windows**

```bash
venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file and add the required API configuration:

```env
LLM_API_KEY=your_api_key_here
```

> ⚠️ Never commit API keys or sensitive credentials to GitHub.

### 6. Run the Backend

```bash
uvicorn main:app --reload
```

Open:

```text
http://localhost:8000
```

---

# 🏗️ Architecture

```text
                         EasyForm AI
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
      🎨 Frontend                         ⚡ FastAPI
     HTML / CSS / JS                       Backend
             │                                 │
             │                  ┌──────────────┼──────────────┐
             │                  │              │              │
             │                  ▼              ▼              ▼
             │            📄 Document      📚 RAG          🤖 LLM
             │             Processing      Pipeline        Service
             │                  │              │              │
             │                  ▼              ▼              │
             │             Text / Field   Embeddings         │
             │                Data       + Retrieval          │
             │                                 │              │
             │                                 └──────┬───────┘
             │                                        │
             └────────────────────────────────────────┤
                                                      ▼
                                            🛡 Grounded Response
                                                      │
                                                      ▼
                                                   👤 User
```

---

# 🔄 AI Workflow

```text
User Uploads Government Form
             │
             ▼
      📄 Document Processing
             │
             ▼
       🧩 Text Extraction
             │
             ▼
        ✂️ Chunking
             │
             ▼
       🧠 Embeddings
             │
             ▼
        📚 RAG Index
             │
             ▼
      👤 User Selects Field
             │
             ▼
        💬 User Query
             │
             ▼
     🔍 Relevant Context Retrieval
             │
             ▼
             🤖 LLM
             │
             ▼
      🛡 Grounded Explanation
             │
             ▼
      🌐 English / Tamil
             │
             ▼
      ✅ User Understands Field
```

---

# 📄 User Journey

```text
User Opens EasyForm AI
        │
        ▼
📤 Upload Government Form
        │
        ▼
📖 View Original Document
        │
        ▼
🔍 Select Confusing Field
        │
        ▼
🤖 AI Understands Field Context
        │
        ▼
📚 Retrieve Relevant Information
        │
        ▼
💬 Ask / Get Explanation
        │
        ▼
🌐 Receive Simple Explanation
        │
        ▼
✅ Fill the Form with Confidence
```

EasyForm AI keeps the **original document visible** while providing AI assistance, allowing users to understand exactly what each field means and what information is expected.

---

# 🧠 How AI Works

EasyForm AI combines multiple AI techniques to create a reliable document assistant.

### 🤖 Large Language Model

The LLM is responsible for:

* Understanding natural-language questions
* Interpreting government terminology
* Explaining complex instructions
* Generating simple responses
* Supporting multilingual interaction

### 📚 Retrieval-Augmented Generation

Instead of directly asking the LLM to answer from its general knowledge, EasyForm AI retrieves relevant information from the uploaded document first.

```text
User Query
    │
    ▼
Retrieve Relevant Form Content
    │
    ▼
Context + Query
    │
    ▼
LLM
    │
    ▼
Grounded Answer
```

This keeps responses connected to the **actual uploaded document**.

### 🔎 Embeddings

Document sections are converted into vector representations so that semantically relevant information can be retrieved even when the user's wording differs from the wording used in the form.

```text
"What should I enter here?"
             │
             ▼
     Semantic Retrieval
             │
             ▼
Relevant Field + Instructions
```

---

# 🛡️ Reliability

Government forms require accurate and trustworthy assistance.

EasyForm AI therefore focuses on **grounded AI responses**.

### Reliability Principles

* 📚 Retrieve information from the uploaded document
* 🎯 Focus on the selected field
* 🚫 Avoid unsupported information
* ⚠️ Indicate when information is unavailable
* 🔎 Use relevant document context
* 👤 Keep the user in control

If the required information is not available:

```text
⚠️ Information not found in the uploaded document.
```

Instead of allowing the model to confidently invent an answer.

---

# 🌐 Multilingual Support

EasyForm AI supports **English + Tamil** to make government forms more accessible.

```text
English User
     │
     ▼
English Query
     │
     ▼
RAG + LLM
     │
     ▼
English Response
```

```text
Tamil User
     │
     ▼
Tamil Query
     │
     ▼
RAG + LLM
     │
     ▼
Tamil Response
```

The goal is to remove language barriers while preserving the meaning of the original government document.

---

# 🎨 Design Philosophy

EasyForm AI is designed around one core principle:

> **Don't make users understand the form. Make the form understandable to users.**

The interface focuses on three simple actions:

* **See** → View the original document
* **Select** → Choose the field you don't understand
* **Understand** → Get a simple AI-powered explanation

This creates a guided experience instead of overwhelming users with a generic chatbot.

---

# 💻 Tech Stack

| Technology                | Purpose                        |
| ------------------------- | ------------------------------ |
| HTML / CSS / JavaScript   | Frontend Interface             |
| FastAPI                   | Backend API                    |
| Python                    | Backend & AI Processing        |
| Large Language Model      | Natural Language Understanding |
| RAG                       | Document-Grounded Generation   |
| Embeddings                | Semantic Document Retrieval    |
| Vector Store              | Knowledge Retrieval            |
| PDF / Document Processing | Form Content Extraction        |
| English + Tamil           | Multilingual Accessibility     |

---

# 🎯 Key Highlights

* 📄 Interactive government form understanding
* 🤖 LLM-powered field explanations
* 📚 RAG-based document grounding
* 🔍 Context-aware information retrieval
* 🌐 English + Tamil accessibility
* 🛡 Hallucination-aware responses
* 🎯 Field-level assistance instead of generic summarization
* 📖 Original document remains visible
* ⚡ Fast and practical AI workflow
* 👤 User-focused form assistance

---

# 🆚 What Makes EasyForm AI Different?

### Traditional Document AI

```text
Upload Document
      │
      ▼
Generate Summary
```

### EasyForm AI

```text
Upload Form
     │
     ▼
View Original Document
     │
     ▼
Select Confusing Field
     │
     ▼
Retrieve Relevant Context
     │
     ▼
Ask AI
     │
     ▼
Get Grounded Explanation
```

EasyForm AI is not simply a **document summarizer**.

It is an **interactive AI assistant designed specifically to help users understand and navigate complex forms**.

---

# 📊 AI Optimization & Evaluation

EasyForm AI can be evaluated by comparing a basic LLM approach with the optimized RAG-based pipeline.

| Metric             | Basic LLM   | EasyForm AI |
| ------------------ | ----------- | ----------- |
| Answer Accuracy    | Baseline    | Improved    |
| Context Relevance  | Variable    | RAG-Based   |
| Hallucination      | Higher Risk | Reduced     |
| Retrieval Accuracy | —           | Measurable  |
| Response Latency   | Baseline    | Optimizable |
| Token Usage        | Baseline    | Optimizable |
| Task Success       | Baseline    | Measurable  |

This provides a foundation for continuously improving **accuracy, reliability, latency, and cost**.

---

# 📋 Prerequisites

| Tool           | Minimum Version |
| -------------- | --------------- |
| Python         | 3.10+           |
| pip            | Latest          |
| Modern Browser | Recommended     |

---

# 🚀 Future Enhancements

* 🧠 Automatic form field detection
* ✍️ AI-assisted form filling
* 📷 OCR support for scanned documents
* 🔎 Hybrid keyword + semantic retrieval
* 🎯 Retrieval reranking
* 🗣️ Voice-based form assistance
* 🌐 Support for more Indian languages
* 🤖 Agentic multi-step application guidance
* 📋 Eligibility and document requirement checking
* 🧪 Automated RAG evaluation
* 🔐 Privacy-focused document processing
* ☁️ Scalable cloud deployment

---

# ❤️ Our Vision

Government services should be accessible to everyone — regardless of their technical knowledge or familiarity with complicated forms.

**EasyForm AI bridges the gap between complex government documents and everyday users using practical AI.**

> **Understand the Form. Understand Your Requirements. Fill with Confidence. 🚀**

---

### 🏆 Built for INTELLIX — LLM & AI Optimization Hackathon

**EasyForm AI — Making complicated forms simple, one field at a time.**
