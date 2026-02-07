# 🚀 How to Run the Project (Simple Guide)

Is project ko run karne ka sabse aasaan tarika niche diya gaya hai. Aapko alag-alag terminals open karne ki jarurat nahi hai.

### ✅ Method 1: Automatic Start (Recommended)
Sirf ye ek command run karein, aur **API + Proxy + App** sab apne aap start ho jayega.

1. **Terminal Open karein** (Project folder `CodersAlpha Manage` mein).
2. Ye command type karein aur Enter dabayein:
   ```bash
   sh start-project.sh
   ```
3. Thodi der wait karein. Screen par ek **QR Code** aayega.
4. Apne phone mein **Expo Go** app se QR code scan karein.

Bas ho gaya! 🎉
*(Band karne ke liye Terminal mein `Ctrl + C` dabayein)*

---

### 🛠 Method 2: Manual Start (Agar script kaam na kare)
Agar upar wala method kaam na kare, to aap ye manual steps follow kar sakte hain (3 alag-alag terminals mein):

**Terminal 1 (Backend):**
```bash
cd InstituteProApi
php artisan serve --host=127.0.0.1 --port=8000
```

**Terminal 2 (Connection Fixer):**
*(Ye "Network Error" hatane ke liye jaruri hai)*
```bash
cd InstituteProApi
node proxy.cjs
```

**Terminal 3 (Mobile App):**
```bash
cd InstituteProApp
npx expo start -c
```
*(Ab QR code scan karein)*

---

### ⚠️ Common Issues & Fixes
- **Network Error:** Iska matlab `node proxy.cjs` nahi chal raha hai. Method 1 use karein, wo ise apne aap chalata hai.
- **Phone Connect Nahi Ho Raha:** Check karein ki Laptop aur Phone **Same Wi-Fi** par hain.
