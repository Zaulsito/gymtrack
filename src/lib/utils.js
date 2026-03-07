export const MAX_LOGS = 10

export const DEFAULT_CATS = [
  'Piernas','Brazos','Cuerpo','Abdominal','Caderas','Espalda','Pecho','Mancuernas','Otros'
]

export const THEMES = {
  default: { label: 'Verde',   color: '#c8ff00' },
  red:     { label: 'Rojo',    color: '#ff2d2d' },
  pink:    { label: 'Rosa',    color: '#ff85c2' },
  blue:    { label: 'Azul',    color: '#4d8eff' },
  cyan:    { label: 'Celeste', color: '#00e5ff' },
}

export const DEMO_EXERCISES = [
  { id: 901, num: 'D01', name: 'Press de banca',    cat: 'Pecho' },
  { id: 902, num: 'D02', name: 'Sentadilla',        cat: 'Piernas' },
  { id: 903, num: 'D03', name: 'Peso muerto',       cat: 'Espalda' },
  { id: 904, num: 'D04', name: 'Curl de bíceps',    cat: 'Brazos' },
  { id: 905, num: 'D05', name: 'Plancha abdominal', cat: 'Abdominal-Caderas' },
]

export const DEMO_LOGS = {
  '901': [
    { peso:'60', reps:'10', series:'3', tam:'', fecha:'2026-02-01', cond:'MANTIENE' },
    { peso:'65', reps:'10', series:'3', tam:'', fecha:'2026-02-15', cond:'SUBE' },
    { peso:'70', reps:'8',  series:'3', tam:'', fecha:'2026-03-01', cond:'SUBE' },
  ],
  '902': [
    { peso:'80', reps:'8', series:'4', tam:'', fecha:'2026-02-03', cond:'MANTIENE' },
    { peso:'85', reps:'8', series:'4', tam:'', fecha:'2026-02-18', cond:'SUBE' },
    { peso:'80', reps:'6', series:'3', tam:'', fecha:'2026-03-02', cond:'BAJA' },
  ],
  '903': [
    { peso:'100', reps:'5', series:'3', tam:'', fecha:'2026-02-05', cond:'SUBE' },
    { peso:'110', reps:'5', series:'3', tam:'', fecha:'2026-02-20', cond:'SUBE' },
    { peso:'110', reps:'5', series:'3', tam:'', fecha:'2026-03-03', cond:'MANTIENE' },
  ],
  '904': [
    { peso:'15', reps:'12', series:'3', tam:'', fecha:'2026-02-07', cond:'SUBE' },
    { peso:'17', reps:'10', series:'3', tam:'', fecha:'2026-02-22', cond:'SUBE' },
    { peso:'15', reps:'12', series:'3', tam:'', fecha:'2026-03-01', cond:'BAJA' },
  ],
  '905': [
    { peso:'', reps:'60', series:'3', tam:'Grande', fecha:'2026-02-10', cond:'MANTIENE' },
    { peso:'', reps:'75', series:'3', tam:'Grande', fecha:'2026-02-25', cond:'SUBE' },
    { peso:'', reps:'90', series:'4', tam:'Grande', fecha:'2026-03-02', cond:'SUBE' },
  ],
}

export const DEMO_TRAINED_DAYS = {
  '2026-02-01':{note:'Buen inicio de mes 💪'}, '2026-02-03':{note:''},
  '2026-02-05':{note:'Récord en peso muerto!'}, '2026-02-07':{note:''},
  '2026-02-10':{note:''}, '2026-02-12':{note:'Cansado pero lo logré'},
  '2026-02-15':{note:''}, '2026-02-17':{note:''}, '2026-02-18':{note:''},
  '2026-02-20':{note:''}, '2026-02-22':{note:''}, '2026-02-24':{note:''},
  '2026-02-25':{note:''}, '2026-02-27':{note:''},
  '2026-03-01':{note:''}, '2026-03-02':{note:''}, '2026-03-03':{note:'Hoy fue duro'},
}

export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function formatDate(d) {
  if (!d) return '-'
  return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' })
}

export function calcCondition(prevLogs, newPeso, newReps, newSecs) {
  if (!prevLogs.length) return 'MANTIENE'
  const last = prevLogs[prevLogs.length - 1]
  const prev = (parseFloat(last.peso) || 0) + (parseFloat(last.reps) || 0) * 0.5 + (parseFloat(last.secs) || 0) * 0.3
  const cur  = (parseFloat(newPeso)  || 0) + (parseFloat(newReps)  || 0) * 0.5 + (parseFloat(newSecs)  || 0) * 0.3
  if (cur > prev + 0.1) return 'SUBE'
  if (cur < prev - 0.1) return 'BAJA'
  return 'MANTIENE'
}

export function emptyUserData(displayName = '', extra = {}) {
  return {
    categories: [...DEFAULT_CATS],
    exercises: [],
    logs: {},
    nextId: 1,
    currentCat: 'Todas',
    displayName,
    firstName:  extra.firstName  || '',
    lastName:   extra.lastName   || '',
    username:   extra.username   || '',
    email:      extra.email      || '',
    phone:      extra.phone      || '',
    weight:     extra.weight     || '',
    height:     extra.height     || '',
    goal:       extra.goal       || '',
    level:      extra.level      || '',
    days:       extra.days       || '',
    photoURL:   extra.photoURL   || '',
    trainedDays: {},
    partners: [],
  }
}

export function resizeImage(file, maxSize = 300) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
          else { w = Math.round(w * maxSize / h); h = maxSize }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
