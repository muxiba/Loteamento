@echo off
setlocal
cd /d "%~dp0"
echo Iniciando a previa do Reserva do Rio...
echo Quando aparecer Local, abra o endereco informado no seu navegador.
echo Mantenha esta janela aberta enquanto estiver usando a previa.
echo.
call npm.cmd run dev:preview -- --port 5173 --strictPort
echo.
echo A previa foi encerrada. Se ocorreu um erro, copie a mensagem acima.
pause
