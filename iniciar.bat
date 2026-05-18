@echo off
title Iniciar - Portal de Evidências
echo ====================================================
echo   Portal de Evidências - E.E. Antônio Caio
echo ====================================================
echo.
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js nao esta instalado neste computador!
    echo O Node.js e necessario para executar este aplicativo.
    echo Por favor, faca o download e instale em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Install dependencies if node_modules folder doesn't exist
if not exist node_modules (
    echo [1/2] Instalando as dependencias do projeto pela primeira vez...
    echo Isso pode levar alguns segundos. Por favor, aguarde...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERRO] Houve uma falha ao instalar as dependencias.
        echo Verifique sua conexao com a internet e tente novamente.
        echo.
        pause
        exit /b %errorlevel%
    )
    echo.
    echo [SUCESSO] Dependencias instaladas com exito!
    echo.
) else (
    echo [1/2] Dependencias ja instaladas.
)

:: Run the Vite development server
echo [2/2] Iniciando o servidor de desenvolvimento Vite na porta 3006...
echo.
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Ocorreu um problema ao rodar o servidor de desenvolvimento.
    echo.
    pause
)
