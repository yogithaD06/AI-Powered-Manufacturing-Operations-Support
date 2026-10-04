# ML Service

Python service that adds the machine-learning features to the MES Support app.
The React app calls it over HTTP through the Vite proxy (`/ml/*` → `http://127.0.0.1:8001/*`).
It is independent of the main `backend/`: it works even when PostgreSQL is down.

> **Honesty note for the demo.** All training data is synthetic (`generate_dataset.py`).
> The scores prove the pipeline works end to end; they say nothing about accuracy on a real plant's tickets.

## Run it

All commands are for **PowerShell** and start in the `ml-service` folder:

```powershell
cd \AI-Powered-Manufacturing-Operations-Support\ml-service
```

Everything runs locally: no API key or external AI service is used.

### 1. First-time setup (once per computer)

```powershell
uv venv --python 3.12 .venv
uv pip install --python .venv\Scripts\python.exe torch --index-url https://download.pytorch.org/whl/cpu
uv pip install --python .venv\Scripts\python.exe -r requirements.txt
.venv\Scripts\python train.py                  # ~1 min, prints accuracy / F1 / confusion matrices
```

This first `train.py` run downloads the `all-MiniLM-L6-v2` embedding model (~90 MB), so it **needs internet
once**. After that the model is cached on the computer. If the download fails, training still finishes but
falls back to a weaker method and prints `using TF-IDF/LSA fallback`; reconnect and run `train.py` again.

### 2. Start the service (every time)

```powershell
.venv\Scripts\uvicorn main:app --reload --port 8001
```

Wait for `Application startup complete`. Then, in a second terminal, start the frontend
(`cd frontend` then `npm run dev`) and open http://localhost:5173 (any username/password works).

Check it's running: http://127.0.0.1:8001/health shows `"status":"ok"`; http://127.0.0.1:8001/docs lists every endpoint.

### 3. Running without internet

Run this **in the same terminal, before** `train.py` or `uvicorn`:

```powershell
$env:HF_HUB_OFFLINE = "1"
.venv\Scripts\uvicorn main:app --port 8001
```

**Why:** when the embedding model loads, the Hugging Face library normally checks online for a newer version.
Without internet that check can delay startup or fail. `HF_HUB_OFFLINE=1` tells it to use the cached copy
directly. The setting lasts only until you close that terminal. The model must already be downloaded (step 1).

## Regenerate the data

`generate_dataset.py` writes the synthetic `data/tickets.csv`, `data/users.csv` and `data/machines.csv`.
Do this after editing the script (for example, changing engineer or reporter names), or to get a different dataset.

**Stop the service first** (Ctrl+C in its terminal), then:

```powershell
$env:HF_HUB_OFFLINE = "1"                                  # optional: only if offline
Remove-Item ml_store.db -ErrorAction SilentlyContinue      # clear old demo activity (may contain old names)
.venv\Scripts\python generate_dataset.py                   # rewrite the CSVs in data\
.venv\Scripts\python train.py                              # retrain so models and results match the new data
.venv\Scripts\uvicorn main:app --reload --port 8001        # start the service again
```

**Always run `train.py` after regenerating.** Otherwise the service keeps using models trained on the old data.

### Options

```powershell
.venv\Scripts\python generate_dataset.py                   # 1200 tickets, seed 42 (the default)
.venv\Scripts\python generate_dataset.py --n 2000          # more tickets
.venv\Scripts\python generate_dataset.py --seed 7          # different random data
.venv\Scripts\python generate_dataset.py --n 2000 --seed 7 # both
```

| Option   | Default | Meaning                                                                                                                                                                                                                         |
| -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--n`    | `1200`  | Number of tickets to generate. More tickets = more history, but the same 18 problem scenarios.                                                                                                                                  |
| `--seed` | `42`    | Starting point of the random generator. **The same seed always produces exactly the same data**, so the default reproduces the committed CSVs. A different number (any number) gives a different but equally realistic dataset. |
| `--out`  | `data`  | Output folder.                                                                                                                                                                                                                  |

You don't need `--seed` after only renaming people: names don't affect the random sequence, so the default
gives the same tickets with the new names. For the presentation, keep the defaults so your results and
rehearsal stay the same. `data/paraphrase_eval.csv` (the hand-written test set) is never touched by the generator.

## What each feature does

| Feature                                           | Endpoint                          | How it works                                                                                                                                                                                                                                                                     |
| ------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category + priority + root-cause (6M) classifiers | `POST /classify`                  | Logistic Regression on three feature sets: word TF-IDF (phrases), character TF-IDF (robust to typos), sentence embeddings (paraphrases). Returns probability, alternatives, and the words that drove the prediction.                                                             |
| Similar / duplicate incidents                     | `POST /similar`                   | Every past ticket is embedded once (384-dim vectors). A new incident is embedded and compared by cosine similarity. ≥ 0.92 is flagged as a possible duplicate.                                                                                                                   |
| Assignee recommendation                           | `POST /recommend-assignee`        | `0.40 × skill match + 0.35 × experience + 0.25 × availability`. Experience = share of the 30 most similar past tickets the engineer resolved. Availability = open tickets (from accepted assignments) and whether they're on shift. Each score comes with plain-English reasons. |
| RCA                                               | `POST /rca`                       | Predicts the 6M category, retrieves the 5 most similar resolved incidents, and drafts a 5-Why chain: the closest matching incident gives the root cause, and a question ladder for the predicted 6M category leads to the systemic cause.                                        |
| CAPA                                              | `POST /capa`                      | Retrieves past incidents with the same root-cause category and ranks the actions that closed them, weighted by similarity, into corrective + preventive actions (action, owner role, due days, verification).                                                                    |
| Recurring issues                                  | `GET /recurring`                  | K-Means clusters of the ticket embeddings (machine names removed, so clusters are _issue types_). Counts per cluster in the last N days vs the N days before, plus machines where it keeps repeating. "Now" is the newest ticket date in the data.                               |
| Feedback loop                                     | `POST /feedback`, `POST /retrain` | Saving an AI-assisted RCA/CAPA in the UI stores the human-approved version in `ml_store.db`. **Retrain models** (AI Predictions page) re-runs `train.py` with those rows included, then hot-reloads.                                                                             |
| Assignments                                       | `POST /assignments`               | "Assign" in the UI records the engineer's workload, which lowers their availability score.                                                                                                                                                                                       |

## Evaluation (latest `train.py` run)

| Model           | Test split accuracy | Majority-class baseline | Hand-written incidents (18) |
| --------------- | ------------------- | ----------------------- | --------------------------- |
| Category        | 100%                | 18%                     | 100%                        |
| Priority        | ~80%                | 38%                     | n/a                         |
| Root cause (6M) | 100%                | 29%                     | 94%                         |

- Category and root cause come from 18 scenario templates, so the random test split contains paraphrases
  of training tickets: 100% is expected and not impressive. `data/paraphrase_eval.csv` (18 incidents
  written in different words) is the more honest check.
- Priority is signalled only by impact phrases in the description ("line stopped", "cosmetic only"),
  with 25% deliberate noise, so it scores lower. That's realistic: priority needs judgment.

## Files

| File                  | Purpose                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| `generate_dataset.py` | Writes the synthetic `data/tickets.csv`, `users.csv`, `machines.csv`             |
| `train.py`            | Trains, evaluates, embeds, clusters → `models/`                                  |
| `engine.py`           | Loads `models/` and answers classify / similar / assignee / recurring            |
| `drafting.py`         | RCA + CAPA drafting from the retrieved similar incidents (fully offline)         |
| `embeddings.py`       | Sentence-embedding wrapper (+ TF-IDF fallback) and the scikit-learn feature step |
| `store.py`            | SQLite (`ml_store.db`) for approved feedback and accepted assignments            |
| `main.py`             | FastAPI app (CORS enabled for the Vite dev server)                               |

## Reset the demo

To clear approved RCAs/CAPAs and "Assign" clicks before presenting (the data itself is unchanged):

```powershell
Remove-Item ml_store.db -ErrorAction SilentlyContinue      # stop the service first
.venv\Scripts\python train.py
```

## Troubleshooting

**VS Code shows `Import "numpy" could not be resolved` (yellow warnings).** The code is fine; VS Code is
checking against a different Python that doesn't have these packages. Press **Ctrl+Shift+P → Python: Select
Interpreter** and pick `ml-service\.venv\Scripts\python.exe`. Run **Developer: Reload Window** if the warnings stay.

**`ML service is not reachable` in the app.** The service isn't running on port 8001; start it (step 2).

**`Models not trained yet`.** Run `.venv\Scripts\python train.py`, then restart the service.
