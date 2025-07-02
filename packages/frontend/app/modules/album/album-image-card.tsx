import { Button, Card } from '@cms/components';
import React from 'react';
interface AlbumImageCardProps {
  source: string;
  title: string;
  content?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}
export function AlbumImageCard(props: AlbumImageCardProps) {
  return (
    <Card className="bg-base-100 shadow-sm">
      <figure>
        <img src={props.source} alt={props.title} />
      </figure>
      <Card.Body>
        <Card.Title>
          {props.title}
        </Card.Title>
        {props.content ? <p>{props.content}</p> : null}
        <Card.Actions className='flex justify-end'>
          <Button variant='primary'>查看详情</Button>
        </Card.Actions>
      </Card.Body>
    </Card>
  );
}
