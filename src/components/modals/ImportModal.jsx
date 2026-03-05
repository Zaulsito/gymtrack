import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useApp } from '../../context/AppContext'
import { today, calcCondition, MAX_LOGS } from '../../lib/utils'

export default function ImportModal({ onClose }) {
  const { state, updateState, showToast, logsKey } = useApp()
  const [step,     setStep]     = useState('info') // info | preview | done
  const [preview,  setPreview]  = useState([])
  const [errors,   setErrors]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const fileRef = useRef()

  function downloadExample() {
    const wb = XLSX.utils.book_new()
    const rows = [
      ['N°', 'Ejercicio', 'Máquina', 'Descripción', 'Peso', 'Reps', 'Series', 'Tamaño', 'Fecha', 'Condición'],
      ['1', 'PRESS DE BANCA', '5', '', '80', '10', '3', 'M', '2024-01-15', 'SUBE'],
      ['2', 'SENTADILLA',     '',  'Con barra libre', '100', '8', '4', 'L', '2024-01-15', 'MANTIENE'],
      ['3', 'CURL DE BICEPS', '12', '', '20', '12', '3', 'S', '2024-01-15', 'BAJA'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{wch:6},{wch:28},{wch:10},{wch:20},{wch:8},{wch:6},{wch:8},{wch:8},{wch:14},{wch:12}]
    XLSX.utils.book_append_sheet(wb, ws, 'Ejemplo')
    XLSX.writeFile(wb, 'GymTrack_Ejemplo.xlsx')
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb      = XLSX.read(evt.target.result, { type: 'array' })
        const parsed  = []
        const errs    = []

        wb.SheetNames.forEach(sheetName => {
          const ws   = wb.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
          if (rows.length < 2) return

          const header = rows[0].map(h => String(h).trim().toLowerCase())
          const iNum   = header.findIndex(h => h.includes('n°') || h.includes('n') || h === 'id')
          const iName  = header.findIndex(h => h.includes('ejercicio') || h.includes('nombre'))
          const iMaq   = header.findIndex(h => h.includes('máquina') || h.includes('maquina'))
          const iDesc  = header.findIndex(h => h.includes('descripción') || h.includes('descripcion'))
          const iPeso  = header.findIndex(h => h.includes('peso'))
          const iReps  = header.findIndex(h => h.includes('reps'))
          const iSeries= header.findIndex(h => h.includes('series'))
          const iTam   = header.findIndex(h => h.includes('tamaño') || h.includes('tamano'))
          const iFecha = header.findIndex(h => h.includes('fecha'))

          if (iName === -1) { errs.push(`Hoja "${sheetName}": no se encontró columna "Ejercicio"`); return }

          rows.slice(1).forEach((row, ri) => {
            const name = String(row[iName] || '').trim()
            if (!name || name === 'SIN DATOS') return
            parsed.push({
              sheet:       sheetName,
              num:         String(row[iNum] || '').trim() || String(parsed.length + 1),
              name:        name.toUpperCase(),
              cat:         sheetName,
              maquina:     iMaq  >= 0 ? String(row[iMaq]  || '').trim() : '',
              descripcion: iDesc >= 0 ? String(row[iDesc] || '').trim() : '',
              peso:        iPeso  >= 0 ? String(row[iPeso]  || '') : '',
              reps:        iReps  >= 0 ? String(row[iReps]  || '') : '',
              series:      iSeries>= 0 ? String(row[iSeries]|| '') : '',
              tam:         iTam   >= 0 ? String(row[iTam]   || '') : '',
              fecha:       iFecha >= 0 ? String(row[iFecha] || today()) : today(),
            })
          })
        })

        setErrors(errs)
        setPreview(parsed)
        setStep('preview')
      } catch (err) {
        showToast('⚠ Error al leer el archivo', 'warn')
      }
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }

  function doImport() {
    if (!preview.length) return
    updateState(prev => {
      const next  = { ...prev }
      const uid   = logsKey()
      if (!next.logs) next.logs = {}
      if (!next.logs[uid]) next.logs[uid] = {}

      // Agrupar por nombre para unificar registros del mismo ejercicio
      const grouped = {}
      preview.forEach(row => {
        const key = row.name
        if (!grouped[key]) grouped[key] = { ...row, logs: [] }
        if (row.peso || row.reps) {
          grouped[key].logs.push({
            peso:   row.peso,
            reps:   row.reps,
            series: row.series,
            tam:    row.tam,
            fecha:  row.fecha,
          })
        }
      })

      const existingNames = new Set((next.exercises || []).map(e => e.name))
      let added = 0

      Object.values(grouped).forEach(ex => {
        if (existingNames.has(ex.name)) return // No duplicar
        const newId = next.nextId
        next.nextId = newId + 1
        next.exercises = [...(next.exercises || []), {
          id:          newId,
          num:         String((next.exercises || []).length + 1),
          name:        ex.name,
          cat:         ex.cat,
          maquina:     ex.maquina,
          descripcion: ex.descripcion,
        }]
        if (ex.logs.length) {
          const logsWithCond = ex.logs.map((l, i) => ({
            ...l,
            cond: calcCondition(ex.logs.slice(0, i), l.peso, l.reps)
          }))
          next.logs[uid][String(newId)] = logsWithCond.slice(-MAX_LOGS)
        }
        added++
      })

      return next
    })
    showToast(`✓ ${preview.length} filas importadas`, 'ok')
    setStep('done')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-h-[85vh] overflow-y-auto">
        <h2 className="font-bebas text-[1.6rem] tracking-wider text-accent mb-4">Importar Ejercicios</h2>

        {/* PASO 1 — Info */}
        {step === 'info' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--muted)]">Importa tus ejercicios desde un archivo Excel (.xlsx). El archivo debe tener estas columnas:</p>

            <div className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3 overflow-x-auto">
              <table className="text-xs w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    {['N°','Ejercicio','Máquina','Descripción','Peso','Reps','Series','Tamaño','Fecha'].map(h => (
                      <th key={h} className="text-left py-1 px-2 text-[var(--muted)] uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 px-2">1</td>
                    <td className="py-1 px-2">PRESS DE BANCA</td>
                    <td className="py-1 px-2 text-accent">5</td>
                    <td className="py-1 px-2 text-[var(--muted)]">-</td>
                    <td className="py-1 px-2">80</td>
                    <td className="py-1 px-2">10</td>
                    <td className="py-1 px-2">3</td>
                    <td className="py-1 px-2">M</td>
                    <td className="py-1 px-2">2024-01-15</td>
                  </tr>
                  <tr className="opacity-60">
                    <td className="py-1 px-2">2</td>
                    <td className="py-1 px-2">SENTADILLA</td>
                    <td className="py-1 px-2 text-[var(--muted)]">-</td>
                    <td className="py-1 px-2 text-accent">Con barra</td>
                    <td className="py-1 px-2">100</td>
                    <td className="py-1 px-2">8</td>
                    <td className="py-1 px-2">4</td>
                    <td className="py-1 px-2">L</td>
                    <td className="py-1 px-2">2024-01-15</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 text-xs text-[var(--muted)]">
              <p>📋 <strong className="text-[var(--text)]">Cada hoja</strong> del Excel se importa como una categoría distinta.</p>
              <p>🔢 <strong className="text-[var(--text)]">Máquina</strong> debe ser un número. <strong className="text-[var(--text)]">Descripción</strong> puede ser texto.</p>
              <p>📅 <strong className="text-[var(--text)]">Fecha</strong> en formato AAAA-MM-DD. Si no hay fecha se usa la de hoy.</p>
              <p>⚠ Los ejercicios que ya existan con el mismo nombre <strong className="text-[var(--text)]">no se duplicarán</strong>.</p>
            </div>

            <button className="btn-outline w-full py-2.5 text-sm" onClick={downloadExample}>
              ⬇ Descargar archivo de ejemplo
            </button>

            <div className="border-t border-[var(--border-color)] pt-4">
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
              <button className="btn-login w-full" onClick={() => fileRef.current?.click()} disabled={loading}>
                {loading ? 'LEYENDO...' : '📂 SELECCIONAR ARCHIVO'}
              </button>
            </div>
          </div>
        )}

        {/* PASO 2 — Preview */}
        {step === 'preview' && (
          <div className="flex flex-col gap-4">
            {errors.length > 0 && (
              <div className="bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.3)] rounded-xl p-3">
                {errors.map((e, i) => <p key={i} className="text-xs text-[var(--down)]">⚠ {e}</p>)}
              </div>
            )}

            <p className="text-sm text-[var(--muted)]">
              Se encontraron <strong className="text-accent">{preview.length} filas</strong>. Revisa antes de importar:
            </p>

            <div className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl overflow-x-auto max-h-[40vh] overflow-y-auto">
              <table className="text-xs w-full min-w-[400px]">
                <thead className="sticky top-0 bg-[var(--surface2)]">
                  <tr className="border-b border-[var(--border-color)]">
                    {['Nombre','Cat.','Máq.','Desc.','Peso','Reps'].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[var(--muted)] uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border-color)] last:border-0">
                      <td className="py-1.5 px-2 font-medium">{row.name}</td>
                      <td className="py-1.5 px-2 text-[var(--muted)]">{row.cat}</td>
                      <td className="py-1.5 px-2 text-accent">{row.maquina || '-'}</td>
                      <td className="py-1.5 px-2 text-[var(--muted)] italic">{row.descripcion || '-'}</td>
                      <td className="py-1.5 px-2">{row.peso || '-'}</td>
                      <td className="py-1.5 px-2">{row.reps || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button className="btn-outline flex-1 py-2.5" onClick={() => { setStep('info'); setPreview([]); setErrors([]) }}>← Volver</button>
              <button className="btn-accent flex-1 py-2.5" onClick={doImport} disabled={!preview.length}>
                ✓ Importar {preview.length} filas
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 — Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-6 py-4 text-center">
            <div className="text-5xl">✅</div>
            <p className="font-bebas text-2xl text-[var(--up)] tracking-widest">¡Importación completada!</p>
            <p className="text-sm text-[var(--muted)]">Tus ejercicios han sido importados correctamente.</p>
            <button className="btn-login w-full" onClick={onClose}>CERRAR</button>
          </div>
        )}

        {step !== 'done' && (
          <button className="btn-outline w-full mt-3 py-2 text-sm" onClick={onClose}>Cancelar</button>
        )}
      </div>
    </div>
  )
}
