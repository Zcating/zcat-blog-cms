interface NavbarProps {
  children?: React.ReactNode;
}
export function Navbar({ children }: NavbarProps) {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">daisyUI</a>
      </div>
      {children ? <div className="flex gap-2">{children}</div> : null}
    </div>
  );
}
