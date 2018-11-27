FROM node:latest

WORKDIR app/

COPY . app/

EXPOSE 8000

ENTRYPOINT ["node", "app/src/client-node.js"]
