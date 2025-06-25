import React from 'react';
interface AlbumImageCardProps {
  source: string;
  title: string;
  content?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}
export function AlbumImageCard(props: AlbumImageCardProps) {
  return (
    <div
      className="card bg-base-100 shadow-sm cursor-pointer"
      onClick={props.onClick}
    >
      <figure>
        <img src={props.source} alt={props.title} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{props.title}</h2>
        {props.content ? <p>{props.content}</p> : null}
      </div>
    </div>
  );
}
