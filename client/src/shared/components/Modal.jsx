import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Button } from './Button';

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children, className = '' }) {
	const panelRef = useRef(null);
	const previouslyFocusedRef = useRef(null);

	useEffect(() => {
		if (!isOpen) {
			return undefined;
		}

		previouslyFocusedRef.current = document.activeElement;

		const focusFirstElement = () => {
			const panel = panelRef.current;
			if (!panel) {
				return;
			}

			const focusableElements = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR));
			const firstFocusable = focusableElements[0];

			if (firstFocusable) {
				firstFocusable.focus();
			} else {
				panel.focus();
			}
		};

		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				onClose?.();
				return;
			}

			if (event.key !== 'Tab') {
				return;
			}

			const panel = panelRef.current;
			if (!panel) {
				return;
			}

			const focusableElements = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR));

			if (focusableElements.length === 0) {
				event.preventDefault();
				panel.focus();
				return;
			}

			const firstFocusable = focusableElements[0];
			const lastFocusable = focusableElements[focusableElements.length - 1];
			const activeElement = document.activeElement;

			if (event.shiftKey) {
				if (activeElement === firstFocusable || !panel.contains(activeElement)) {
					event.preventDefault();
					lastFocusable.focus();
				}
			} else if (activeElement === lastFocusable) {
				event.preventDefault();
				firstFocusable.focus();
			}
		};

		const timer = window.setTimeout(focusFirstElement, 0);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			window.clearTimeout(timer);
			document.removeEventListener('keydown', handleKeyDown);
			const previouslyFocused = previouslyFocusedRef.current;

			if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
				previouslyFocused.focus();
			}
		};
	}, [isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	return ReactDOM.createPortal(
		<div className="fixed inset-0 bg-[#1A1A1A]/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div
				ref={panelRef}
				className={`bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg mx-4 transition-all duration-200 outline-none ${className}`.trim()}
				onClick={(event) => event.stopPropagation()}
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<div className="mb-5 flex items-center justify-between gap-4">
					<h2 id="modal-title" className="text-lg font-black text-[#1A1A1A]">
						{title}
					</h2>
					<Button variant="ghost" className="min-h-[44px] min-w-[44px] px-0" onClick={onClose} aria-label="Close modal">
						✕
					</Button>
				</div>
				{children}
			</div>
		</div>,
		document.body
	);
}

export default Modal;
