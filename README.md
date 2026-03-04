# 🏋️ GymTrack — React + Vite + Tailwind

App de seguimiento de entrenamiento personal con Firebase.

---

## 🚀 Cómo correr el proyecto

### 1. Instala las dependencias
```bash
npm install
```

### 2. Corre el servidor de desarrollo
```bash
npm run dev
```

### 3. Abre en el navegador
```
http://localhost:5173
```

---

## 📦 Build para producción
```bash
npm run build
npm run preview
```

---

## 📁 Estructura del proyecto

```
gymtrack-react/
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthScreen.jsx       # Wrapper de pantalla de auth
│   │   │   └── AuthPanels.jsx       # Login, Register, VerifyEmail
│   │   ├── calendar/
│   │   │   └── CalendarScreen.jsx   # Calendario de entrenamientos
│   │   ├── exercises/
│   │   │   ├── ExerciseList.jsx     # Vista principal con categorías
│   │   │   ├── ExerciseCard.jsx     # Tarjeta individual de ejercicio
│   │   │   └── ExerciseChart.jsx    # Gráfico SVG de progreso
│   │   ├── layout/
│   │   │   ├── Header.jsx           # Barra superior con menús
│   │   │   ├── DemoBanner.jsx       # Banner de modo demo
│   │   │   └── Toast.jsx            # Notificaciones flotantes
│   │   ├── modals/
│   │   │   ├── AddExerciseModal.jsx # Modal para agregar ejercicio
│   │   │   ├── ManageCatsModal.jsx  # Gestionar categorías
│   │   │   └── Modals.jsx           # Summary, Privacy, Welcome
│   │   ├── partner/
│   │   │   └── PartnerScreen.jsx    # Sistema de compañeros
│   │   └── profile/
│   │       ├── ProfileScreen.jsx        # Mi perfil + cambiar contraseña
│   │       └── CompleteProfileScreen.jsx # Post-verificación onboarding
│   ├── context/
│   │   └── AppContext.jsx        # Estado global (React Context)
│   ├── hooks/
│   │   └── useAuth.js            # Hook de autenticación Firebase
│   ├── lib/
│   │   ├── firebase.js           # Configuración Firebase
│   │   └── utils.js              # Helpers, constantes, datos demo
│   ├── App.jsx                   # Componente raíz + router de vistas
│   ├── main.jsx                  # Entry point React
│   └── index.css                 # Estilos globales + Tailwind + temas
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🎨 Temas disponibles
- **Verde** (default) — `#c8ff00`
- **Rojo** — `#ff2d2d`
- **Rosa** — `#ff85c2`
- **Azul** — `#4d8eff`
- **Celeste** — `#00e5ff`

---

## 🔥 Firebase
El proyecto usa Firebase (ya configurado):
- **Auth** — Email/password con verificación
- **Firestore** — Base de datos por usuario

Si quieres usar tu propio proyecto Firebase, edita `src/lib/firebase.js`.

---

## ✅ Features implementadas
- 🔐 Registro con verificación de email
- 📝 Perfil completo post-verificación
- 🏋️ Ejercicios por categorías (con CRUD completo)
- 📊 Gráfico SVG de progreso por ejercicio
- 📅 Calendario de días entrenados con notas
- 📈 Resumen mensual
- 🤝 Sistema de partners con enlace de invitación
- 🎨 5 temas de color
- 👀 Modo demo sin cuenta
- 📥 Exportar a Excel (XLSX)
- 📱 PWA instalable
- 🔄 Migración automática desde datos legacy
