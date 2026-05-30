FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY next.config.ts ./
COPY next-env.d.ts ./
COPY tsconfig.json ./
COPY pages ./pages
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/next-env.d.ts ./next-env.d.ts
COPY --from=build /app/pages ./pages
COPY --from=build /app/src ./src
EXPOSE 5000
CMD ["npm", "start"]
