@echo off
REM Bento Box Docker - Script de Inicialização para Windows
REM Este script facilita o gerenciamento dos containers Docker

setlocal enabledelayedexpansion

REM Verifica se Docker está instalado
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Docker nao esta instalado!
    echo Instale Docker Desktop: https://www.docker.com/products/docker-desktop
    exit /b 1
)

REM Função principal
if "%1"=="" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="rebuild" goto rebuild
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="seed" goto seed
if "%1"=="backup" goto backup
if "%1"=="clean" goto clean
if "%1"=="shell" goto shell
if "%1"=="help" goto help
goto help

:start
echo ========================================
echo   Bento Box - Iniciando Containers
echo ========================================
echo.
docker compose up -d
echo.
echo Aguardando containers ficarem prontos...
timeout /t 10 /nobreak >nul
echo.
docker compose ps
echo.
echo ========================================
echo Containers iniciados!
echo.
echo Frontend: http://localhost
echo Backend API: http://localhost:3001
echo MongoDB: localhost:27017
echo Maintenance: http://localhost/maintenance-hub.html
echo.
echo Use 'docker.bat logs' para ver logs
echo ========================================
goto end

:stop
echo ========================================
echo   Bento Box - Parando Containers
echo ========================================
echo.
docker compose down
echo.
echo Containers parados!
goto end

:restart
echo ========================================
echo   Bento Box - Reiniciando Containers
echo ========================================
echo.
docker compose restart
echo.
echo Containers reiniciados!
goto end

:rebuild
echo ========================================
echo   Bento Box - Rebuilding Containers
echo ========================================
echo.
docker compose up -d --build
echo.
echo Rebuild completo!
goto end

:logs
echo ========================================
echo   Bento Box - Logs
echo ========================================
echo.
if "%2"=="" (
    echo Exibindo logs de todos os containers...
    docker compose logs -f
) else (
    echo Exibindo logs do container: %2
    docker compose logs -f %2
)
goto end

:status
echo ========================================
echo   Bento Box - Status
echo ========================================
echo.
echo Status dos Containers:
docker compose ps
echo.
echo Volumes:
docker volume ls | findstr bento-box
echo.
echo Networks:
docker network ls | findstr bento
goto end

:seed
echo ========================================
echo   Bento Box - Seed Database
echo ========================================
echo.
docker compose ps | findstr "bento-box-backend.*Up" >nul
if %errorlevel% neq 0 (
    echo [ERRO] Backend nao esta rodando!
    echo Execute 'docker.bat start' primeiro
    exit /b 1
)
echo Executando seed do banco de dados...
docker exec bento-box-backend node dist/backend/scripts/seed-products.js
echo.
echo Seed executado com sucesso!
goto end

:backup
echo ========================================
echo   Bento Box - Backup MongoDB
echo ========================================
echo.
set BACKUP_DIR=backups\%date:~-4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
echo Criando backup em: %BACKUP_DIR%
mkdir "%BACKUP_DIR%" 2>nul
docker exec bento-box-mongodb mongodump --db bento-box --out /data/backup
docker cp bento-box-mongodb:/data/backup "%BACKUP_DIR%"
echo.
echo Backup criado em: %BACKUP_DIR%
goto end

:clean
echo ========================================
echo   Bento Box - Limpeza Completa
echo ========================================
echo.
echo [ATENCAO] Isso vai remover TODOS os containers, volumes e dados!
set /p confirm="Tem certeza? (digite 'yes' para confirmar): "
if /i "%confirm%"=="yes" (
    echo Removendo containers, volumes e dados...
    docker compose down -v --rmi all
    echo.
    echo Limpeza completa!
) else (
    echo Operacao cancelada
)
goto end

:shell
if "%2"=="" (
    echo [ERRO] Especifique o container: backend ou mongodb
    exit /b 1
)
if /i "%2"=="backend" (
    echo Abrindo shell no backend...
    docker exec -it bento-box-backend sh
) else if /i "%2"=="mongodb" (
    echo Abrindo mongosh...
    docker exec -it bento-box-mongodb mongosh bento-box
) else (
    echo [ERRO] Container invalido. Use: backend ou mongodb
    exit /b 1
)
goto end

:help
echo ========================================
echo   Bento Box - Docker Manager
echo ========================================
echo.
echo Uso: docker.bat [comando] [opcoes]
echo.
echo Comandos disponiveis:
echo   start          - Inicia todos os containers
echo   stop           - Para todos os containers
echo   restart        - Reinicia todos os containers
echo   rebuild        - Rebuilda e reinicia os containers
echo   logs [service] - Exibe logs
echo   status         - Mostra status dos containers
echo   seed           - Popula o banco de dados
echo   backup         - Cria backup do MongoDB
echo   clean          - Remove tudo (containers, volumes, dados)
echo   shell [name]   - Abre shell no container (backend, mongodb)
echo   help           - Exibe esta mensagem
echo.
echo Exemplos:
echo   docker.bat start
echo   docker.bat logs backend
echo   docker.bat shell mongodb
echo.
goto end

:end
endlocal
