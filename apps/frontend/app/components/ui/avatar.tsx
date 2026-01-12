interface AvatarProps {
  src?: string;
}
export function Avatar(props: AvatarProps) {
  return (
    <div className="avatar">
      <div className="w-32 rounded">
        <img src={props.src} />
      </div>
    </div>
  );
}
