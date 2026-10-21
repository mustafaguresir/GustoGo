@echo off
chcp 65001 >nul
echo ========================================================
echo   GustoGo - 7 Dakikalık İnteraktif Sunum ve Mimari Paneli
echo ========================================================
echo.
echo Sunum paneli ve tüm Mermaid diyagramları tarayıcıda açılıyor...
echo.

start "" "%~dp0docs\sunumda_yapilmasi_gerekenler\INTERAKTIF_SUNUM_VE_REHBER.html"

exit
