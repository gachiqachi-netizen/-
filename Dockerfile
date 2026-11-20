FROM python:3.12-slim
WORKDIR /app
COPY server/requirements.txt server/requirements-postgres.txt ./server/
ARG PIP_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/
RUN pip install --no-cache-dir -i "$PIP_INDEX_URL" -r server/requirements-postgres.txt
COPY server ./server
COPY kb ./kb
COPY tools ./tools
ENV PORT=8800 SERVER_HOST=0.0.0.0 DATA_DIR=/data PYTHONUNBUFFERED=1
RUN mkdir -p /data && useradd --create-home --uid 10001 appuser && chown appuser:appuser /data
USER appuser
EXPOSE 8800
CMD ["python", "server/app.py"]
