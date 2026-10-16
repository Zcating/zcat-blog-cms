import type { Article } from '@blog/server/article/schemas';
import type { PhotoFeedItem } from '@blog/server/photo/schemas';

const PHOTOS_PER_ARTICLE = 2;

export type HomeGridItem =
  | { kind: 'photo'; photo: PhotoFeedItem }
  | { kind: 'article'; article: Article };

export function buildHomeGridItems(
  articles: Article[],
  photos: PhotoFeedItem[],
): HomeGridItem[] {
  const items: HomeGridItem[] = [];
  let articleIndex = 0;
  let photoIndex = 0;
  let photosSinceArticle = 0;

  while (articleIndex < articles.length || photoIndex < photos.length) {
    const photoRoom = photos.length - photoIndex;
    const articleRoom = articles.length - articleIndex;

    if (
      articleRoom > 0 &&
      photosSinceArticle >= PHOTOS_PER_ARTICLE &&
      articleRoom <= photoRoom
    ) {
      items.push({ kind: 'article', article: articles[articleIndex]! });
      articleIndex += 1;
      photosSinceArticle = 0;
      continue;
    }

    if (photoRoom > 0) {
      items.push({ kind: 'photo', photo: photos[photoIndex]! });
      photoIndex += 1;
      photosSinceArticle += 1;
      continue;
    }

    items.push({ kind: 'article', article: articles[articleIndex]! });
    articleIndex += 1;
    photosSinceArticle = 0;
  }

  return items;
}
