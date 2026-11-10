FROM python:3.12-slim
WORKDIR /app
COPY server ./server
COPY kb ./kb
COPY prototype.html ./prototype.html
RUN pip install --no-cache-dir -r server/requirements-postgres.txt
ENV PORT=8800 SERVER_HOST=0.0.0.0 DATA_DIR=/data PYTHONUNBUFFERED=1
RUN mkdir -p /data && useradd --create-home --uid 10001 appuser && chown appuser:appuser /data
USER appuser
EXPOSE 8800
CMD ["python", "server/app.py"]
