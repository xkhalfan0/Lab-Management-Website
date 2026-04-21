# Lab System — Setup Steps (Copy & Follow)

---

## STEP 1: Install Cursor AI

1. Go to https://www.cursor.com
2. Click "Download for free"
3. Run the installer
4. Open Cursor when done
5. Sign up with Google or GitHub (free plan is fine)

---

## STEP 2: Install Node.js 22

1. Go to https://nodejs.org
2. Click the green "22.x.x LTS" button (left one)
3. Run the downloaded .msi file
4. Click Next → Next → Next → Install → Finish
5. RESTART your computer

After restart, open Command Prompt and test:

```
node --version
```
Should show: v22.x.x

```
npm --version
```
Should show: 10.x.x or 11.x.x

---

## STEP 3: Fix PATH (only if npm not recognized)

Skip this if Step 2 worked.

Try this first:
```
"C:\Program Files\nodejs\npm" --version
```

If that shows a number, run this as Administrator:
```
setx PATH "%PATH%;C:\Program Files\nodejs" /M
```

Close terminal. Open new one. Test again:
```
npm --version
```

---

## STEP 4: Install pnpm

```
npm install -g pnpm
```

Test:
```
pnpm --version
```
Should show: 10.x.x

---

## STEP 5: Install Docker Desktop

1. Go to https://www.docker.com/products/docker-desktop/
2. Click "Download for Windows"
3. Run the installer
4. Keep "Use WSL 2" checked
5. Click Install
6. RESTART your computer
7. After restart, Docker Desktop opens automatically
8. Wait for the whale icon (bottom-right taskbar) to stop animating

Test in Command Prompt:
```
docker --version
```

If Docker won't start, open Command Prompt as Administrator and run:
```
wsl --install
```
Then restart again.

---

## STEP 6: Start MySQL Database

Open Command Prompt and run:

```
docker run -d --name lab-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root123 -e MYSQL_DATABASE=lab_management mysql:8
```

First time takes 2-3 minutes (downloading MySQL image).

When done you'll see a long ID string — that means it's running.

Test:
```
docker ps
```
Should show "lab-mysql" with status "Up".

Wait 10 seconds before next step.

---

## ALL TOOLS INSTALLED ✓

You now have:
- ✅ Cursor AI (code editor)
- ✅ Node.js 22 (runtime)
- ✅ pnpm (package manager)
- ✅ Docker (container engine)
- ✅ MySQL 8 (database — running in Docker)

---

## NEXT: Set up the project

Now follow the project setup steps:

1. Unzip the source code
2. Open the folder in Cursor
3. Create .env file
4. Run: pnpm install
5. Run: pnpm db:push
6. Run: node seed-test-types.mjs
7. Run: pnpm dev
8. Open http://localhost:3000
9. Click "Initial System Setup" to create admin account