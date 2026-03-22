import type { Note } from '@/lib/types'

/** 与 NoteListPage 一致：文件类笔记在列表中直接打开链接/附件，其余进入详情 */
export function openNoteOrFile(
  note: Note,
  openViewer: (noteId: string) => void
) {
  if (note.type === 'file' && note.sourceUrl) {
    window.open(note.sourceUrl, '_blank')
    return
  }
  openViewer(note.id)
}
