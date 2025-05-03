@echo off
setlocal enabledelayedexpansion

:: Pergunta ao usuário as palavras para substituir
set /p "palavraAntiga=Digite a palavra que será substituída: "
set /p "palavraNova=Digite a nova palavra: "

echo.
echo Procurando pastas contendo "%palavraAntiga%" no nome...

:: Processa cada pasta no diretório atual
for /d %%A in (*%palavraAntiga%*) do (
    set "nomePasta=%%A"
    set "novoNome=!nomePasta:%palavraAntiga%=%palavraNova%!"
    
    if not "!nomePasta!"=="!novoNome!" (
        echo Renomeando: "!nomePasta!" para "!novoNome!"
        ren "!nomePasta!" "!novoNome!"
    )
)

echo.
echo Concluído!
pause