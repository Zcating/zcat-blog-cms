import { Button, Card } from '@cms/components';
import React from 'react';
interface AlbumImageCardProps {
  source: string;
  title: string;
  content?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
export function AlbumCard(props: AlbumImageCardProps) {
  return (
    <Card>
      <Card.Figure src={props.source} alt={props.title} />
      <Card.Body>
        <Card.Title>{props.title}</Card.Title>
        {props.content ? <p>{props.content}</p> : null}
        <Card.Actions className="flex justify-end">
          <Button variant="primary" onClick={props.onClick}>
            查看详情
          </Button>
        </Card.Actions>
      </Card.Body>
    </Card>
  );
}
