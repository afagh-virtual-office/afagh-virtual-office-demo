FROM node:22-alpine
WORKDIR /app/runtime/p0-1
COPY runtime/p0-1/package.json ./package.json
RUN npm install --omit=dev
COPY runtime/p0-1 ./
ENV NODE_ENV=production
ENV AFAGH_RUNTIME_MODE=production
EXPOSE 8787
CMD ["npm","start"]
