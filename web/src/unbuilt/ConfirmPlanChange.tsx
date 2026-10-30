import { useEffect, useRef } from 'react';
export default function ConfirmPlanChange({ title, detail, action, onConfirm, onCancel, recovery = 'Undo restores this change only while this project stays open. Switching projects, reloading or closing ends plan Undo/Redo.', cancelLabel = 'Keep plan' }: { title: string; detail: string; action: string; onConfirm: () => void; onCancel: () => void; recovery?: string; cancelLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return <dialog ref={ref} className="confirm-plan-change" aria-labelledby="confirm-title" aria-describedby="confirm-detail confirm-recovery" onCancel={onCancel}><h2 id="confirm-title">{title}</h2><p id="confirm-detail">{detail}</p><p id="confirm-recovery">{recovery}</p><div><button type="button" autoFocus onClick={onCancel}>{cancelLabel}</button><button type="button" className="destructive" onClick={onConfirm}>{action}</button></div></dialog>;
}
