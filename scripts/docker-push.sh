#!/bin/bash
set -e

SSH_HOST="${SSH_HOST}"
SSH_USER="${SSH_USER}"
REMOTE_DIR="${REMOTE_DIR}"
PROJECT_NAME="${PROJECT_NAME}"
COMPOSE_FILE="${COMPOSE_FILE}"
ENV_FILE="${ENV_FILE}"

echo "部署到 ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"

ssh ${SSH_USER}@${SSH_HOST} 'mkdir -p ${REMOTE_DIR}/'

scp ${COMPOSE_FILE} ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}

scp ${ENV_FILE} ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}

if ["${PROJECT_NAME}" = ""]
then
  echo "部署所有服务"
  ssh ${SSH_USER}@${SSH_HOST} "cd ${REMOTE_DIR} && \
  docker compose --env-file ${ENV_FILE} pull && \
  docker compose --env-file ${ENV_FILE} down && \
  docker compose --env-file ${ENV_FILE} up"
else
  echo "部署服务 ${PROJECT_NAME}"
  ssh ${SSH_USER}@${SSH_HOST} "cd ${REMOTE_DIR} && \
  docker compose --env-file ${ENV_FILE} pull -p ${PROJECT_NAME} && \
  docker compose --env-file ${ENV_FILE} down -p ${PROJECT_NAME} && \
  docker compose --env-file ${ENV_FILE} up -p ${PROJECT_NAME}"
fi
