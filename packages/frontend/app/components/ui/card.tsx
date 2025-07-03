import React from 'react';
import { cn } from '../utils';
import { FileImageOutlined } from '@ant-design/icons';

type CardSize = 'sm' | 'md' | 'lg' | 'xl' | 'xs';
type CardAppearance = 'border' | 'dash';
interface CardProps {
  className?: string;
  size?: CardSize;
  appearance?: CardAppearance;
  children: React.ReactNode;
}

export function Card(props: CardProps) {
  const className = cn(
    'card bg-base-100 shadow-sm',
    cardSizeFrom(props.size),
    cardAppearanceFrom(props.appearance),
    props.className,
  );

  return <div className={className}>{props.children}</div>;
}

interface CardFigureProps {
  src: string;
  alt: string;
}

function CardFigure(props: CardFigureProps) {
  const [isEmpty, setIsEmpty] = React.useState(!props.src);
  const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsEmpty(true);
  };

  return (
    <figure className="aspect-[16/9] shadow-md bg-gray-200">
      {isEmpty ? (
        <div className="w-full h-full flex items-center justify-center">
          <FileImageOutlined className="text-3xl" />
        </div>
      ) : (
        <img
          className="w-full h-full object-contain"
          src={props.src}
          alt={props.alt}
          onError={onError}
        />
      )}
    </figure>
  );
}

interface CardTitleProps {
  className?: string;
  children?: React.ReactNode;
}

function CardTitle(props: CardTitleProps) {
  const className = cn('card-title', props.className);
  return <h2 className={className}>{props.children}</h2>;
}

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

function CardBody(props: CardBodyProps) {
  const className = cn('card-body', props.className);
  return <div className={className}>{props.children}</div>;
}

interface CardActionsProps {
  className?: string;
  children: React.ReactNode;
}

function CardActions(props: CardActionsProps) {
  const className = cn('card-actions justify-end', props.className);
  return <div className={className}>{props.children}</div>;
}

Card.Figure = CardFigure;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Actions = CardActions;

const CARD_SIZE_MAP = new Map([
  ['xs', 'card-xs'],
  ['sm', 'card-sm'],
  ['md', 'card-md'],
  ['lg', 'card-lg'],
  ['xl', 'card-xl'],
]);

function cardSizeFrom(size?: CardSize) {
  return size ? CARD_SIZE_MAP.get(size) : 'card-md';
}

const CARD_APPEARANCE_MAP = new Map([
  ['border', 'card-border'],
  ['dash', 'card-dash'],
]);

function cardAppearanceFrom(appearance?: CardAppearance) {
  return appearance ? CARD_APPEARANCE_MAP.get(appearance) : '';
}
