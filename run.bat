@echo off
echo.
echo ========================================
echo   PDF Editor 서버 시작 중...
echo ========================================
echo.
echo 로컬 접속: http://localhost:17722
echo 외부 접속: http://[내부IP]:17722
echo.
python -m http.server 17722 --bind 0.0.0.0
