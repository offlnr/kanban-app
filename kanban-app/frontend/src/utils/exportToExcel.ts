import * as XLSX from 'xlsx'
import type { KanbanColumn, Task, WorkPackage, Phase } from '../types'

interface ExportData {
  projectName: string
  columns: KanbanColumn[]
  tasks: Task[]
  phases: Phase[]
  workPackages: WorkPackage[]
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export function exportProjectToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Kanban — one row per task, grouped by column
  const kanbanRows: Record<string, string | number>[] = []
  const sortedColumns = [...data.columns].sort((a, b) => a.order - b.order)

  for (const col of sortedColumns) {
    const colTasks = data.tasks
      .filter((t) => t.column_id === col.id)
      .sort((a, b) => a.order - b.order)
    for (const task of colTasks) {
      const wp = data.workPackages.find((w) => w.id === task.work_package_id)
      kanbanRows.push({
        'Columna': col.name,
        'Tarea': task.title,
        'Descripción': task.description ?? '',
        'Prioridad': PRIORITY_LABELS[task.priority] ?? task.priority,
        'Horas Estimadas': task.estimated_hours ?? '',
        'Fecha Límite': task.due_date ?? '',
        'Paquete de Trabajo': wp?.name ?? '',
      })
    }
  }

  const wsKanban = XLSX.utils.json_to_sheet(
    kanbanRows.length > 0
      ? kanbanRows
      : [{ 'Columna': '', 'Tarea': '', 'Descripción': '', 'Prioridad': '', 'Horas Estimadas': '', 'Fecha Límite': '', 'Paquete de Trabajo': '' }]
  )
  wsKanban['!cols'] = [
    { wch: 18 }, { wch: 35 }, { wch: 40 },
    { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, wsKanban, 'Kanban')

  // Sheet 2: EDT — hierarchy: Phase > Work Package > Task
  const edtRows: Record<string, string | number>[] = []
  const sortedPhases = [...data.phases].sort((a, b) => a.order - b.order)

  for (const phase of sortedPhases) {
    const phaseWps = data.workPackages
      .filter((wp) => wp.phase_id === phase.id)
      .sort((a, b) => a.order - b.order)

    for (const wp of phaseWps) {
      const wpTasks = data.tasks
        .filter((t) => t.work_package_id === wp.id)
        .sort((a, b) => a.order - b.order)

      if (wpTasks.length === 0) {
        edtRows.push({
          'Fase': phase.name,
          'Paquete de Trabajo': wp.name,
          'Tarea': '',
          'Prioridad': '',
          'Horas Estimadas': '',
          'Fecha Límite': '',
        })
        continue
      }

      for (const task of wpTasks) {
        edtRows.push({
          'Fase': phase.name,
          'Paquete de Trabajo': wp.name,
          'Tarea': task.title,
          'Prioridad': PRIORITY_LABELS[task.priority] ?? task.priority,
          'Horas Estimadas': task.estimated_hours ?? '',
          'Fecha Límite': task.due_date ?? '',
        })
      }
    }
  }

  const wsEdt = XLSX.utils.json_to_sheet(
    edtRows.length > 0
      ? edtRows
      : [{ 'Fase': '', 'Paquete de Trabajo': '', 'Tarea': '', 'Prioridad': '', 'Horas Estimadas': '', 'Fecha Límite': '' }]
  )
  wsEdt['!cols'] = [
    { wch: 25 }, { wch: 30 }, { wch: 35 },
    { wch: 12 }, { wch: 16 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsEdt, 'EDT')

  const safeName = data.projectName.replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/g, '_').trim()
  XLSX.writeFile(wb, `${safeName}_kanban_edt.xlsx`)
}
