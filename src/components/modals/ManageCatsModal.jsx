import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function ManageCatsModal({ onClose }) {
  const { state, updateState, showToast } = useApp()
  const [newCat, setNewCat] = useState('')
  const [edits,  setEdits]  = useState({})

  function addCategory() {
    if (!newCat.trim()) { showToast('⚠ Escribe un nombre', 'warn'); return }
    if (state.categories.includes(newCat.trim())) { showToast('⚠ Ya existe', 'warn'); return }
    updateState(prev => ({ ...prev, categories: [...prev.categories, newCat.trim()] }))
    setNewCat('')
    showToast('✓ Categoría agregada', 'ok')
  }

  function renameCategory(idx) {
    const newName = (edits[idx] ?? state.categories[idx]).trim()
    const oldName = state.categories[idx]
    if (!newName || newName === oldName) return
    if (state.categories.includes(newName)) { showToast('⚠ Ya existe', 'warn'); return }
    updateState(prev => {
      const cats = [...prev.categories]
      cats[idx]  = newName
      const exercises = prev.exercises.map(ex => ex.cat === oldName ? { ...ex, cat: newName } : ex)
      const currentCat = prev.currentCat === oldName ? newName : prev.currentCat
      return { ...prev, categories: cats, exercises, currentCat }
    })
    showToast('✓ Categoría renombrada', 'ok')
  }

  function deleteCategory(idx) {
    const name  = state.categories[idx]
    const count = state.exercises.filter(e => e.cat === name).length
    if (count > 0 && !confirm(`"${name}" tiene ${count} ejercicio(s). ¿Eliminar?`)) return
    updateState(prev => {
      const cats     = prev.categories.filter((_, i) => i !== idx)
      const exercises = prev.exercises.map(ex => ex.cat === name ? { ...ex, cat: 'Otros' } : ex)
      const currentCat = prev.currentCat === name ? 'Todas' : prev.currentCat
      return { ...prev, categories: cats, exercises, currentCat }
    })
    showToast('✓ Categoría eliminada', 'ok')
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 500 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="font-bebas text-[1.6rem] tracking-wider text-accent mb-5">Gestionar Categorías</h2>

        <div className="mb-4 flex flex-col gap-2">
          {state.categories.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-2 py-2 border-b border-[var(--border-color)]">
              <span className="flex-1 text-sm">{cat}</span>
              <input
                className="input-field flex-1 py-1 text-xs"
                defaultValue={cat}
                onChange={e => setEdits(v => ({ ...v, [idx]: e.target.value }))}
              />
              <button className="btn-accent py-1 px-2 text-xs" onClick={() => renameCategory(idx)}>✓</button>
              <button className="btn-danger py-1 px-2 text-xs" onClick={() => deleteCategory(idx)}>🗑</button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-3 border-t border-[var(--border-color)]">
          <input className="input-field flex-1" placeholder="Nueva categoría..." value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
          <button className="btn-accent px-4" onClick={addCategory}>＋</button>
        </div>

        <div className="flex gap-3 mt-4">
          <button className="btn-outline flex-1 py-2" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
