/** Branch selector for forms; collapses to a hidden field when only one branch is allowed. */
export function BranchField({ branches, defaultValue }: { branches: string[]; defaultValue: string }) {
  if (branches.length === 1) {
    return (
      <div className="label">
        Branch
        <div className="input mt-1 bg-slate-100">{branches[0]}</div>
        <input type="hidden" name="branch" value={branches[0]} />
      </div>
    );
  }
  return (
    <label className="label">
      Branch
      <select name="branch" defaultValue={defaultValue} className="input mt-1">
        {branches.map((b) => (
          <option key={b}>{b}</option>
        ))}
      </select>
    </label>
  );
}
