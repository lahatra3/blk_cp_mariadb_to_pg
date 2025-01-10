FROM oven/bun:slim

WORKDIR /app

COPY package.json .
RUN bun install --production

COPY . .

CMD [ "bun", "--production", "--smol", "main.ts" ]