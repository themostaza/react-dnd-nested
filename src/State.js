/* @flow */
import _ from "lodash";
// Types
export type Card = {
  id: number,
  level: number,
  isDragged?: boolean,
  initialLevel?: number
};
export type CardList = Card[];

const NUMBER_OF_ELEMENTS = 10;

// Implementation
let cards: CardList = [];
let movingCards: ?CardList = null;
let observer = null;

export type NestedCard = {
  id: number,
  childrens: NestedCardList
};
export type NestedCardList = NestedCard[];

export const setCards = (nestedCards: NestedCardList) => {
  const unwrapNestedCard = (card: NestedCard, level: number = 0) => {
    const childrens = _.flatten(
      card.childrens.map(c => unwrapNestedCard(c, level + 1))
    );
    return _.flatten([{ id: card.id, level }, childrens]);
  };

  cards = _.flatten(nestedCards.map(c => unwrapNestedCard(c, 0)));
  emitChange();
};

export const getCards = (): NestedCardList => {
  const getNestedCardChildrens = (
    firstIndex: number
  ): { card: NestedCard, nextIndex: number } => {
    const parentCard = cards[firstIndex];
    const childrens: NestedCardList = [];
    let i = firstIndex + 1;
    for (; i < cards.length; i++) {
      const currentCard = cards[i];
      if (parentCard.level < currentCard.level) {
        let result = getNestedCardChildrens(i);
        childrens.push(result.card);
        i = result.nextIndex;
      } else {
        break;
      }
    }
    return { card: { id: parentCard.id, childrens }, nextIndex: i - 1 };
  };

  const nestedCards = [];
  let lastCard;
  for (let i = 0; i < cards.length; i++) {
    const result = getNestedCardChildrens(i);
    nestedCards.push(result.card);
    i = result.nextIndex;
  }
  return nestedCards;
};

const emitChange = () => {
  if (observer)
    movingCards != null ? observer(movingCards, true) : observer(cards, false);
};

export const observe = (o: (cards: CardList, isDragging: boolean) => {}) => {
  if (observer) {
    throw new Error("Multiple observers not implemented.");
  }

  observer = o;
  emitChange();
};

export const addCard = (id: number, parentId?: number) => {
  //cards.push({ id, childrens: [] });
  emitChange();
};

let lostChild = [];
export const beginDrag = (id: number) => {
  let hideLevel = null;
  let firstChildIndex = -1;
  let length = 0;

  for (let i = 0; i < cards.length; i++) {
    let card = cards[i];
    if (card.id === id) {
      card.isDragged = true;
      card.initialLevel = card.level;
      hideLevel = card.level;
    } else {
      if (hideLevel != null) {
        if (card.level > hideLevel) {
          if (firstChildIndex === -1) firstChildIndex = i;
          length += 1;
        } else {
          break;
        }
      }
    }
  }
  movingCards = _.cloneDeep(cards);
  if (firstChildIndex !== -1) {
    lostChild = movingCards.slice(firstChildIndex, firstChildIndex + length);
    movingCards = [
      ...movingCards.slice(0, firstChildIndex),
      ...movingCards.slice(firstChildIndex + length)
    ];
  }
  emitChange();
};

export const endDrag = (id: number) => {
  const cardIndex = _.findIndex(movingCards, c => c.id === id);
  if (cardIndex !== -1 && movingCards != null) {
    const card = movingCards[cardIndex];

    const lostChildLevel =
      card.initialLevel != null ? card.initialLevel - card.level : 0;
    for (let child of lostChild) {
      child.level -= lostChildLevel;
    }

    let difference;
    for (let i = cardIndex + 1; i < movingCards.length; i++) {
      if (!difference) difference = movingCards[i].level - card.level;
      if (movingCards[i].level > card.level) {
        movingCards[i].level = movingCards[i].level - difference + 1;
      } else {
        break;
      }
    }
    movingCards[cardIndex].isDragged = undefined;
    movingCards[cardIndex].initialLevel = undefined;
    cards = [
      ...movingCards.slice(0, cardIndex + 1),
      ...lostChild,
      ...movingCards.slice(cardIndex + 1)
    ];

    movingCards = null;
    lostChild = [];
    emitChange();
  }
};

export const moveCard = (
  id: number,
  {
    beforeId,
    afterId,
    parentId,
    newLevel
  }: {
    beforeId?: number,
    afterId?: number,
    parentId?: number,
    newLevel?: number
  }
) => {
  const cardIndex = _.findIndex(movingCards, c => c.id === id);
  if (cardIndex !== -1 && movingCards != null) {
    const card = movingCards[cardIndex];

    let oldLevel = card.level;
    if (newLevel != null) {
      if (cardIndex === 0) {
        card.level = 0;
      } else {
        const maximumLevel = movingCards[cardIndex - 1].level + 1;
        card.level = Math.min(maximumLevel, newLevel);
      }
    }

    let newParentIndex;

    if (afterId != null && movingCards != null) {
      movingCards = [
        ...movingCards.slice(0, cardIndex),
        ...movingCards.slice(cardIndex + 1)
      ];
      newParentIndex = _.findIndex(movingCards, c => c.id === afterId) + 1;
      movingCards = [
        ...movingCards.slice(0, newParentIndex + 1),
        card,
        ...movingCards.slice(newParentIndex + 1)
      ];
    }

    if (beforeId != null && movingCards != null) {
      movingCards = [
        ...movingCards.slice(0, cardIndex),
        ...movingCards.slice(cardIndex + 1)
      ];
      newParentIndex = _.findIndex(movingCards, c => c.id === beforeId);
      movingCards = [
        ...movingCards.slice(0, newParentIndex),
        card,
        ...movingCards.slice(newParentIndex)
      ];
    }

    emitChange();
  }
};
