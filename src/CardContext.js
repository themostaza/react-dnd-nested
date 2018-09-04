/* @flow */
import React from "react";
import _ from "lodash";
// Types
export type Card = {
  id: number,
  level: number,
  isDragged?: boolean,
  initialLevel?: number
};
export type CardList = Card[];

export type NestedCard = {
  id: number,
  childrens: NestedCardList
};
export type NestedCardList = NestedCard[];

type Props = {
  children?: any
};

type State = {
  cards: CardList
};

const DEFAULT_STATE = { cards: [] };

export const CardContext = React.createContext(DEFAULT_STATE);

export default class CardProvider extends React.Component<Props, State> {
  state = DEFAULT_STATE;

  lostChild = [];
  movingCards: CardList = [];

  setCards = (nestedCards: NestedCardList) => {
    const unwrapNestedCard = (card: NestedCard, level: number = 0) => {
      const childrens = _.flatten(
        card.childrens.map(c => unwrapNestedCard(c, level + 1))
      );
      return _.flatten([{ id: card.id, level }, childrens]);
    };

    this.setState({
      cards: _.flatten(nestedCards.map(c => unwrapNestedCard(c, 0)))
    });
  };

  getCards = (): NestedCardList => {
    const getNestedCardChildrens = (
      firstIndex: number
    ): { card: NestedCard, nextIndex: number } => {
      const parentCard = this.state.cards[firstIndex];
      const childrens: NestedCardList = [];
      let i = firstIndex + 1;
      for (; i < this.state.cards.length; i++) {
        const currentCard = this.state.cards[i];
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
    for (let i = 0; i < this.state.cards.length; i++) {
      const result = getNestedCardChildrens(i);
      nestedCards.push(result.card);
      i = result.nextIndex;
    }
    return nestedCards;
  };

  beginDrag = (id: number) => {
    let hideLevel = null;
    let firstChildIndex = -1;
    let length = 0;

    for (let i = 0; i < this.state.cards.length; i++) {
      let card = this.state.cards[i];
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
    this.movingCards = _.cloneDeep(this.state.cards);
    if (firstChildIndex !== -1) {
      this.lostChild = this.movingCards.slice(
        firstChildIndex,
        firstChildIndex + length
      );
      this.movingCards = [
        ...this.movingCards.slice(0, firstChildIndex),
        ...this.movingCards.slice(firstChildIndex + length)
      ];
    }
    this.setState({ cards: this.movingCards });
  };

  endDrag = (id: number) => {
    const cardIndex = _.findIndex(this.movingCards, c => c.id === id);
    if (cardIndex !== -1 && this.movingCards != null) {
      const card = this.movingCards[cardIndex];

      const lostChildLevel =
        card.initialLevel != null ? card.initialLevel - card.level : 0;
      for (let child of this.lostChild) {
        child.level -= lostChildLevel;
      }

      let difference;
      for (let i = cardIndex + 1; i < this.movingCards.length; i++) {
        if (!difference) difference = this.movingCards[i].level - card.level;
        if (this.movingCards[i].level > card.level) {
          this.movingCards[i].level =
            this.movingCards[i].level - difference + 1;
        } else {
          break;
        }
      }
      this.movingCards[cardIndex].isDragged = undefined;
      this.movingCards[cardIndex].initialLevel = undefined;
      let cards = [
        ...this.movingCards.slice(0, cardIndex + 1),
        ...this.lostChild,
        ...this.movingCards.slice(cardIndex + 1)
      ];

      this.movingCards = [];
      this.lostChild = [];
      this.setState({ cards });
    }
  };

  moveCard = (
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
    const cardIndex = _.findIndex(this.movingCards, c => c.id === id);
    if (cardIndex !== -1 && this.movingCards != null) {
      const card = this.movingCards[cardIndex];

      if (newLevel != null) {
        if (cardIndex === 0) {
          card.level = 0;
        } else {
          const maximumLevel = this.movingCards[cardIndex - 1].level + 1;
          card.level = Math.min(maximumLevel, newLevel);
        }
      }

      let newParentIndex;

      if (afterId != null && this.movingCards != null) {
        this.movingCards = [
          ...this.movingCards.slice(0, cardIndex),
          ...this.movingCards.slice(cardIndex + 1)
        ];
        newParentIndex =
          _.findIndex(this.movingCards, c => c.id === afterId) + 1;
        this.movingCards = [
          ...this.movingCards.slice(0, newParentIndex + 1),
          card,
          ...this.movingCards.slice(newParentIndex + 1)
        ];
      }

      if (beforeId != null && this.movingCards != null) {
        this.movingCards = [
          ...this.movingCards.slice(0, cardIndex),
          ...this.movingCards.slice(cardIndex + 1)
        ];
        newParentIndex = _.findIndex(this.movingCards, c => c.id === beforeId);
        this.movingCards = [
          ...this.movingCards.slice(0, newParentIndex),
          card,
          ...this.movingCards.slice(newParentIndex)
        ];
      }

      this.setState({ cards: this.movingCards });
    }
  };

  render() {
    return (
      <CardContext.Provider
        value={{
          ...this.state,
          moveCard: this.moveCard,
          endDrag: this.endDrag,
          beginDrag: this.beginDrag,
          getCards: this.getCards,
          setCards: this.setCards
        }}
      >
        {this.props.children}
      </CardContext.Provider>
    );
  }
}
