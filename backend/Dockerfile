FROM oven/bun:1

WORKDIR /app

# Install deps first so this layer caches even when source changes
COPY package.json bun.lockb* ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "--hot", "src/index.ts"]
