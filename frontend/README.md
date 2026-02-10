## Frontend notes

- The frontend now reads `VITE_API_BASE_URL` (set in `.env`) to know how to reach Django.
- When the variable is not provided, it falls back to `http(s)://<current-host>:8000/api`, which works for the default Docker compose setup (`localhost:3000` → `localhost:8000`) and for local `npm run dev`.

### Setting the API base URL

Create a `.env` file under `frontend/` (not committed) with:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

Set this to whatever public URL your backend is exposed on (including `/api`). Rebuild the frontend image (or restart the dev server) after changing this value.
