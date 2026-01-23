# Deployment Guide: TeachMeAI Agentic Architecture

You have moved from a monolithic Vercel app to a **Microservices Architecture**.

## 🏗️ The New Architecture

| Component | Hosted On | Responsibility |
| :--- | :--- | :--- |
| **Frontend** (`src/`) | **Vercel** | The UI, forms, and validation. It sends the intake data to the Agent Service. |
| **Agent Service** (`agent-service/`) | **Google Cloud Run** | The "Brain". Runs the Genkit agents (Profiler, Strategist, etc.) on a scalable serverless container. |

## 🚀 Step 1: Deploy the Agent Service (The Backend)

You need to deploy the `agent-service` folder to Google Cloud Run. This will give you a URL (e.g., `https://agent-service-xyz.run.app`) that the frontend needs to talk to.

### Prerequisites
-   Google Cloud Project with billing enabled.
-   **`gcloud` CLI installed**:
    -   **Mac (Homebrew)**: `brew install --cask google-cloud-sdk`
    -   **Manual Download**: [Install Guide](https://cloud.google.com/sdk/docs/install#mac)
    -   *Note: If specific `sudo` permissions fail with Homebrew, use the Manual Download.*
-   Authenticate by running: `gcloud auth login`

### Deployment Commands

1.  **Navigate to the service**:
    ```bash
    cd agent-service
    ```

2.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy teachmeai-agent-service \
      --source . \
      --region us-central1 \
      --allow-unauthenticated
    ```

3.  **Get the URL**:
    The command will output a Service URL. **Copy this URL**.
    *Example: `https://teachmeai-agent-service-uc.a.run.app`*

## 🔗 Step 2: Connect the Frontend (The Frontend)

Now you need to tell your Vercel frontend where the "Brain" is.

1.  **Go to Vercel Dashboard**:
    Open your project settings for `teachmeai-intake-app`.

2.  **Environment Variables**:
    Add a new variable:
    *   **Key**: `AGENT_SERVICE_URL`
    *   **Value**: `https://<YOUR-CLOUD-RUN-URL>/supervisorFlow`
    *   *Important: Append `/supervisorFlow` to the base URL.*

3.  **Redeploy Frontend**:
    Trigger a new deployment in Vercel so the new environment variable takes effect.
