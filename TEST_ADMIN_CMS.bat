@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PORT=3000"
set "URL=http://localhost:%PORT%"

echo ============================================
echo   STUDYVUI ADMIN CMS - MOI TRUONG TEST (LOCAL)
echo ============================================
echo.
echo  Server: %URL%  (goi backend production qua CORS localhost:3000)
echo  Thu muc: %CD%
echo.

REM --- Cai dependencies neu thieu node_modules ---
if not exist "node_modules" (
  echo  Chua co node_modules - dang chay "npm install" ...
  call npm install
)

REM --- Mo Next.js dev server o cua so rieng ---
echo  Dang khoi dong Next.js dev server (next dev) ...
start "AdminCMS Dev Server" cmd /k "npm run dev"

REM --- Doi server san sang (Next.js compile lan dau hoi lau) ---
echo  Dang cho server san sang (co the mat 10-40 giay lan dau)...
set /a TRIES=0
:WAIT
set /a TRIES+=1
if %TRIES% gtr 40 goto OPEN
timeout /t 2 /nobreak >nul
curl -s -o nul -m 5 %URL%
if errorlevel 1 goto WAIT

:OPEN
REM --- Tim Chrome o cac vi tri thuong gap ---
set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

REM --- Mo trinh duyet (cua so thuong de giu phien dang nhap) ---
if defined CHROME (
  echo  Dang mo Chrome...
  start "" "%CHROME%" "%URL%"
) else (
  echo  Khong thay Chrome - mo bang trinh duyet mac dinh.
  start "" "%URL%"
)

echo.
echo  XONG! Trong trinh duyet:
echo    1. Dang nhap: admin@studyvui.vn
echo    2. Vao menu  Cau hoi (Questions)  -^>  Tao cau hoi
echo    3. Che do "Trac nghiem 4 lua chon", Loai cau hoi "Chon hinh"
echo    4. Moi dap an A-D: bam "Chon anh" + dien nhan chu
echo    5. Muc "Asset dinh kem": chon audio de bai
echo    6. Chon dap an dung -^>  Tao moi  -^>  publish
echo.
echo  De DUNG test: dong cua so den ten "AdminCMS Dev Server".
echo  Cua so nay tu dong dong sau vai giay.
timeout /t 6 /nobreak >nul
