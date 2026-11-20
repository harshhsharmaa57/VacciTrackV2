# 🤖 VacciTrack VaxBot - n8n RAG Architecture & Setup Guide

This guide explains how **RAG (Retrieval-Augmented Generation)** is implemented in VacciTrack using **n8n** and how to run & present it to your teacher/evaluator.

---

## 📌 1. What is RAG & Why Use n8n?

- **Traditional Chatbots:** Often hallucinate, give generic answers, or don't know India's official National Immunization Schedule (NIS 2025) or post-vaccine fever dosages.
- **RAG (Retrieval-Augmented Generation):**
  1. **User asks a question** (e.g. *"What should I do if my baby gets a fever after Pentavalent vaccine?"*).
  2. **Retriever fetches verified facts** from [`docs/nis_2025_immunization_knowledge_base.md`](file:///d:/Projects/VacciTrack/docs/nis_2025_immunization_knowledge_base.md).
  3. **LLM (Gemini / OpenAI)** reads the verified facts and produces an accurate, medically safe response.
- **n8n Workflow Engine:** Acts as the visual, low-code orchestrator that connects the Webhook, Vector Store, Embeddings, and Gemini AI Agent.

---

## 🏗️ 2. Architecture Diagram

```
+--------------------------------------------------------------------+
|                       VacciTrack Web App                           |
|  (ParentDashboard / DoctorDashboard - VaxBot Chat Interface)       |
+---------------------------------+----------------------------------+
                                  |
                   HTTP POST /webhook/vaxbot-rag
                                  |
                                  v
+--------------------------------------------------------------------+
|                         n8n Workflow                               |
|                                                                    |
|  [Webhook Trigger]                                                 |
|         |                                                          |
|         v                                                          |
|  [AI Agent (LangChain RAG)] <==== [Google Gemini / Chat Model]     |
|         |                                                          |
|         +-- [Vector Store Retriever (In-Memory / Qdrant)]          |
|         |        ^                                                 |
|         |        | (Vector Search on Knowledge Base)               |
|         |   [nis_2025_immunization_knowledge_base.md]              |
|         |                                                          |
|         v                                                          |
|  [Respond to Webhook]                                              |
+---------------------------------+----------------------------------+
                                  |
                    JSON Response: { answer: "..." }
                                  |
                                  v
+--------------------------------------------------------------------+
|                  VacciTrack VaxBot UI                              |
|           (Displays verified response to parent)                   |
+--------------------------------------------------------------------+
```

---

## 🚀 3. How to Run and Test (Step-by-Step)

### Step 1: Start n8n Locally
Open PowerShell or Terminal and run:
```bash
npx n8n
```
*n8n will start and show `Editor is accessible at: http://localhost:5678`.*

### Step 2: Open n8n & Import Workflow
1. Open your browser and go to: `http://localhost:5678`
2. Follow the 1-minute initial local setup (enter your name/email).
3. Click **Workflows** > **Import from File...**
4. Select the file:
   `d:\Projects\VacciTrack\n8n-workflows\vaxbot_rag_workflow.json`

### Step 3: Connect Your Gemini API Key
1. In the imported workflow, click the **Google Gemini Chat Model** node.
2. Under **Credential to connect with**, click **Create New Credential**.
3. Paste your free Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com/)).
4. Click **Save**.

### Step 4: Activate & Connect Webhook
1. Toggle the workflow status in n8n from **Inactive** to **Active** (top right switch).
2. The webhook URL is: `http://localhost:5678/webhook/vaxbot-rag`.
3. In VacciTrack's `.env` (or `.env.local`), add:
   ```env
   VITE_N8N_RAG_WEBHOOK_URL=http://localhost:5678/webhook/vaxbot-rag
   ```

### Step 5: Test in VacciTrack!
1. Open VacciTrack in your browser (`http://localhost:8080`).
2. Open the **VaxBot** chatbot.
3. Ask a clinical question:
   - *"What should I do if my baby gets a fever after Pentavalent vaccine?"*
   - *"BCG vaccine ke baad scar kab banta hai?"*
   - *"What vaccines are given at 10 weeks under NIS?"*
4. Watch n8n execute the workflow, search the knowledge base, and return the exact verified answer to VaxBot!

---

## 🛡️ 4. Offline / Fail-Safe Mechanism
If n8n is stopped or unavailable, VacciTrack **automatically falls back** to the built-in clinical rule engine without throwing any errors or freezing.
