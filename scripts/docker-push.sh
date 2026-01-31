#!/bin/bash
set -euo pipefail

LOG_DIR="./logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/deploy_${TIMESTAMP}.log"

mkdir -p "${LOG_DIR}"

log() {
    local level="$1"
    shift
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] $*"
    echo "${msg}" | tee -a "${LOG_FILE}"
}

log_error() {
    log "ERROR" "$@" >&2
}

cleanup() {
    local exit_code=$?
    if [ ${exit_code} -ne 0 ]; then
        log_error "部署失败，退出码: ${exit_code}"
        log_error "详细日志: ${LOG_FILE}"
    fi
    exit ${exit_code}
}

trap cleanup EXIT

SSH_HOST="${SSH_HOST:-}"
SSH_USER="${SSH_USER:-}"
REMOTE_DIR="${REMOTE_DIR:-}"
PROJECT_NAME="${PROJECT_NAME:-}"
COMPOSE_FILE="${COMPOSE_FILE:-}"
ENV_FILE="${ENV_FILE:-}"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-}"

log "INFO" "========== 开始部署 =========="
log "INFO" "部署目标: ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"
log "INFO" "项目名称: ${PROJECT_NAME:-全部}"
log "INFO" "日志文件: ${LOG_FILE}"

if [ -z "${SSH_HOST}" ] || [ -z "${SSH_USER}" ] || [ -z "${REMOTE_DIR}" ]; then
    log_error "缺少必要的环境变量: SSH_HOST, SSH_USER, REMOTE_DIR"
    exit 1
fi

log "INFO" "验证本地文件..."
for file in "${COMPOSE_FILE}" "${ENV_FILE}"; do
    if [ ! -f "${file}" ]; then
        log_error "本地文件不存在: ${file}"
        exit 1
    fi
    log "INFO" "  ✓ ${file} 存在"
done

if [ -n "${BACKEND_ENV_FILE}" ] && [ ! -f "${BACKEND_ENV_FILE}" ]; then
    log_error "后端环境文件不存在: ${BACKEND_ENV_FILE}"
    exit 1
fi

log "INFO" "验证SSH连接..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" "echo 'SSH连接成功'" 2>&1 | tee -a "${LOG_FILE}"; then
    log_error "SSH连接失败"
    exit 1
fi

log "INFO" "创建远程目录结构..."
ssh "${SSH_USER}@${SSH_HOST}" "mkdir -p ${REMOTE_DIR}/apps/backend && chmod -R 755 ${REMOTE_DIR}" 2>&1 | tee -a "${LOG_FILE}"

log "INFO" "上传文件到远程服务器..."
log "INFO" "  上传 ${COMPOSE_FILE}..."
if ! scp -o ConnectTimeout=30 "${COMPOSE_FILE}" "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/" 2>&1 | tee -a "${LOG_FILE}"; then
    log_error "上传 ${COMPOSE_FILE} 失败"
    exit 1
fi

log "INFO" "  上传 ${ENV_FILE}..."
if ! scp -o ConnectTimeout=30 "${ENV_FILE}" "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/" 2>&1 | tee -a "${LOG_FILE}"; then
    log_error "上传 ${ENV_FILE} 失败"
    exit 1
fi

if [ -n "${BACKEND_ENV_FILE}" ] && [ -f "${BACKEND_ENV_FILE}" ]; then
    log "INFO" "  上传 ${BACKEND_ENV_FILE}..."
    if ! scp -o ConnectTimeout=30 "${BACKEND_ENV_FILE}" "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/apps/backend/.env.production" 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "上传后端环境文件失败"
        exit 1
    fi
else
    log "WARNING" "跳过后端环境文件上传 (文件不存在或未设置)"
fi

log "INFO" "========== 执行 Docker Compose =========="

DOCKER_COMPOSE_CMD="docker-compose"

if [ -z "${PROJECT_NAME}" ] || [ "${PROJECT_NAME}" = "frontend" ]; then
    log "INFO" "部署所有服务..."
    
    log "INFO" "拉取最新镜像..."
    if ! ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && ${DOCKER_COMPOSE_CMD} --env-file ${ENV_FILE} pull" 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "拉取镜像失败"
        exit 1
    fi
    
    log "INFO" "停止现有服务..."
    if ! ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && ${DOCKER_COMPOSE_CMD} --env-file ${ENV_FILE} down" 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "停止服务失败"
        exit 1
    fi
    
    log "INFO" "启动服务..."
    if ! ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && ${DOCKER_COMPOSE_CMD} --env-file ${ENV_FILE} up -d" 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "启动服务失败"
        exit 1
    fi
    
else
    log "INFO" "部署单个服务: ${PROJECT_NAME}"
    
    log "INFO" "拉取服务镜像..."
    if ! ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && ${DOCKER_COMPOSE_CMD} --env-file ${ENV_FILE} pull ${PROJECT_NAME}" 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "拉取镜像失败"
        exit 1
    fi
    
    log "INFO" "停止服务..."
    if ! ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && ${DOCKER_COMPOSE_CMD} --env-file ${ENV_FILE} down ${PROJECT_NAME}" 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "停止服务失败"
        exit 1
    fi
    
    log "INFO" "启动服务..."
    if ! ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && ${DOCKER_COMPOSE_CMD} --env-file ${ENV_FILE} up -d ${PROJECT_NAME}" 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "启动服务失败"
        exit 1
    fi
fi

log "INFO" "验证服务状态..."
ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && ${DOCKER_COMPOSE_CMD} --env-file ${ENV_FILE} ps" 2>&1 | tee -a "${LOG_FILE}"

log "INFO" "========== 部署完成 =========="
log "INFO" "日志文件: ${LOG_FILE}"
