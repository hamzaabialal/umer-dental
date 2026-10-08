import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a useActionState action without React's automatic form reset,
 * so a validation error doesn't wipe what the user typed.
 */
export function submitWith(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
