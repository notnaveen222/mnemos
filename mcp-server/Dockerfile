# OPTIONAL. Vercel does NOT use this file — it builds from requirements.txt +
# app.py. This Dockerfile is only for a container host (e.g. Render) as a
# fallback. See ../DEPLOY.md for the primary Vercel path.

FROM python:3.11-slim

# Run as a normal user, not root.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PORT=8000

WORKDIR /home/user/app

# Install dependencies first so Docker caches this layer across code changes.
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the app code in.
COPY --chown=user . .

EXPOSE 8000

# Runs the server the standard always-on way (streamable-HTTP over $PORT).
CMD ["python", "server.py"]
