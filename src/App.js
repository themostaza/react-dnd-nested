/* @flow */
import React, { Component, Fragment } from "react";
import logo from "./logo.svg";
import "./App.css";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";
import { setCards, getCards } from "./State";

import type { CardList } from "./State";

import Card from "./Card";

type Props = {
  cards: CardList,
  isDragging: boolean
};

let cards = [
  { id: 0, childrens: [{ id: 2, childrens: [{ id: 3, childrens: [] }] }] },
  { id: 1, childrens: [] }
];

class App extends Component<Props> {
  componentDidMount() {
    setCards(cards);
  }

  componentDidUpdate(oldProps: Props) {
    if (!this.props.isDragging && oldProps.isDragging) {
      console.log(getCards());
    }
  }
  _renderCards = ({ id, level, isDragged, initialLevel }) => {
    return <Card key={id} id={id} level={level} initialLevel={initialLevel} />;
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div>{this.props.cards.map(this._renderCards)}</div>
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(App);
