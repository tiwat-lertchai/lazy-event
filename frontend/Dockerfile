FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .

EXPOSE 5173

# --host is required so Vite listens on all interfaces inside the container,
# not just 127.0.0.1 — otherwise Docker port mapping can't reach it
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
