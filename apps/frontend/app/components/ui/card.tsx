import { FileImageOutlined } from '@ant-design/icons';
import React from 'react';

import { classnames } from '../utils';

import { Image } from './image';

type CardSize = 'sm' | 'md' | 'lg' | 'xl' | 'xs';
type CardAppearance = 'border' | 'dash';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: CardSize;
  appearance?: CardAppearance;
  children: React.ReactNode;
}

export function Card(props: CardProps) {
  const { className, size, appearance, children, ...rest } = props;
  const cls = classnames(
    'card bg-base-100 shadow-sm',
    cardSizeFrom(size),
    cardAppearanceFrom(appearance),
    className,
  );

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

interface CardFigureProps {
  src?: string;
  alt: string;
}

function CardFigure(props: CardFigureProps) {
  const [isEmpty, setIsEmpty] = React.useState(!props.src);
  const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsEmpty(true);
  };

  return (
    <figure className="aspect-[4/3] shadow-md bg-gray-200">
      {isEmpty ? (
        <div className="w-full h-full flex items-center justify-center">
          <FileImageOutlined className="text-3xl" />
        </div>
      ) : (
        <Image
          className="w-full h-full"
          contentMode="scaleDown"
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
  const className = classnames('card-title px-3 py-4', props.className);
  return <h2 className={className}>{props.children}</h2>;
}

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

function CardBody(props: CardBodyProps) {
  const className = classnames('card-body', props.className);
  return <div className={className}>{props.children}</div>;
}

interface CardActionsProps {
  className?: string;
  children: React.ReactNode;
}

function CardActions(props: CardActionsProps) {
  const className = classnames('card-actions justify-end', props.className);
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
