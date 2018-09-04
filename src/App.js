/* @flow */
import React, { Component, Fragment } from "react";
import logo from "./logo.svg";
import "./App.css";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";

import Card from "./Card";
import CardContextProvider, { CardContext } from "./CardContext";
//import { observe, setCards, getCards } from "./State";

import type { CardList } from "./CardContext";

type Props = {
  cards: CardList,
  isDragging: boolean,
  cardContext: Object
};

let cards = [
  { id: 0, childrens: [{ id: 2, childrens: [{ id: 3, childrens: [] }] }] },
  { id: 1, childrens: [] }
];

class ReactDNDNested extends Component<Props> {
  componentDidMount() {
    this.props.cardContext.setCards(cards);
  }

  componentDidUpdate(oldProps: Props) {
    if (!this.props.isDragging && oldProps.isDragging) {
      console.log(this.props.cardContext.getCards());
    }
  }
  _renderCards = ({ id, level, isDragged, initialLevel }) => {
    return <Card key={id} id={id} level={level} initialLevel={initialLevel} />;
  };

  render() {
    return (
      <div className="ReactDNDNested">
        <div>{this.props.cardContext.cards.map(this._renderCards)}</div>
      </div>
    );
  }
}

const ReactDNDNestedWithContext = props => (
  <CardContextProvider>
    <CardContext.Consumer>
      {cardContext => <ReactDNDNested {...props} cardContext={cardContext} />}
    </CardContext.Consumer>
  </CardContextProvider>
);

export default DragDropContext(HTML5Backend)(ReactDNDNestedWithContext);
